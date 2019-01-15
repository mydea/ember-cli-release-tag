const GitRepo = require('./../utils/git-repo');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const SilentError = require('silent-error');

const configPath = 'config/release.js';

const availableHooks = [
  'init',
  'beforeCommit',
  'afterCommit',
  'afterCreateTag',
  'afterPush'
];

const availableOptions = [
  {
    name: 'local',
    type: Boolean,
    aliases: ['l'],
    default: false,
    description: 'whether release commit and tags are locally or not (not pushed to a remote)',
    validInConfig: true
  },
  {
    name: 'remote',
    type: String,
    aliases: ['r'],
    default: 'origin',
    description: 'the git origin to push tags to, ignored if the \'--local\' option is true',
    validInConfig: true
  },
  {
    name: 'tag',
    type: String,
    aliases: ['t'],
    description: 'the name of the git tag to create'
  },
  {
    name: 'annotation',
    type: String,
    aliases: ['a'],
    description: 'a message passed to the `--message` option of `git tag`, indicating that to the tag should be created with the `--annotated` option (default is lightweight), the string \'%@\' is replaced with the tag name',
    validInConfig: true
  },
  {
    name: 'message',
    type: String,
    aliases: ['m'],
    default: 'Released %@',
    description: 'a message passed to the `--message` option of `git commit`, the string \'%@\' is replaced with the tag name',
    validInConfig: true
  },
  {
    name: 'manifest',
    type: Array,
    default: ['package.json', 'bower.json'],
    description: 'a set of JSON files to replace the top-level `version` property in with the new tag name',
    validInConfig: true
  },
  {
    name: 'publish',
    type: Boolean,
    aliases: ['p'],
    default: false,
    description: 'whether to publish package to NPM after tagging or not',
    validInConfig: true
  },
  {
    name: 'yes',
    type: Boolean,
    aliases: ['y'],
    default: false,
    description: 'whether to skip confirmation prompts or not (answer \'yes\' to all questions)'
  },
  {
    name: 'strategy',
    type: String,
    aliases: ['s'],
    default: 'semver',
    description: 'strategy for auto-generating the tag name, either \'semver\' or \'date\', ignored if the \'name\' option is specified',
    validInConfig: true
  },
  {
    name: 'major',
    type: Boolean,
    aliases: ['j'],
    description: 'specifies that the major version number should be incremented'
  },
  {
    name: 'minor',
    type: Boolean,
    aliases: ['i'],
    description: 'specifies that the minor version number should be incremented, ignored if \'--major\' option is true'
  },
  {
    name: 'prerelease',
    type: [String, Boolean],
    aliases: ['e'],
    description: 'specifies that the named pre-release version number should be incremented'
  }
];

function findBy(array, prop, value) {
  return array.find((item) => item[prop] === value);
}


module.exports = {
  name: 'release',
  description: 'Create a new git tag at HEAD',
  works: 'insideProject',

  availableOptions,

  async run(commandOptions) {
    let { project } = this;
    let repo = new GitRepo(project.root);
    let baseOptions = this.getConfig();

    let options = Object.assign({}, baseOptions, commandOptions);
    if (typeof options.strategy === 'string') {
      options.strategy = require(`./../strategies/${options.strategy}`);
    }

    options.repo = repo;
    options.project = project;

    await this.beforeCreateTag(options);
    await this.createTag(options);
    await this.afterCreateTag(options);
  },

  async beforeCreateTag(options) {
    options.tags = await this._getTags(options);
    await this._executeHook('init', options);
    await this._promptIfWorkingTreeDirty(options);
  },

  async createTag(options) {
    await this._printLatestTag(options);
    await this._replaceVersionInManifests(options);
    await this._executeHook('beforeCommit', options);
    await this._createCommit(options);
    await this._executeHook('afterCommit', options);
    await this._promptToCreateGitTag(options);
    await this._createGitTag(options);
    await this._executeHook('afterCreateTag', options);
  },

  async afterCreateTag(options) {
    await this._pushGitChanges(options);
    await this._executeHook('afterPush', options);
  },

  getConfig() {
    if (this._parsedConfig) {
      return this._parsedConfig;
    }

    let { ui, project, availableOptions } = this;
    let fullConfigPath = path.join(project.root, configPath);
    let config = {};
    let strategy;

    if (fs.existsSync(fullConfigPath)) {
      config = require(fullConfigPath);
    }

    // Preserve strategy if it's a function
    if (typeof config.strategy === 'function') {
      strategy = {
        getNextTag: config.strategy
      };
    }

    // If it is an object, use it - but it has to have a `getNextTag` method defined
    if (typeof config.strategy === 'object') {
      if (typeof config.strategy.getNextTag === 'function') {
        strategy = config.strategy;
      } else {
        ui.writeLine(chalk.yellow('Warning: a custom `strategy` object must define a `getNextTag` function, ignoring'));
      }
    }

    // Extract hooks
    let hooks = availableHooks.reduce(function(result, hookName) {
      if (typeof config[hookName] === 'function') {
        result[hookName] = config[hookName];
        delete config[hookName];
      } else if (config[hookName] !== undefined) {
        ui.writeLine(chalk.yellow(`Warning: "${hookName}" is not a function in "${configPath}", ignoring`));
      }

      return result;
    }, {});

    let configOptions = availableOptions.filter((option) => option.validInConfig);
    let optionTypeMap = configOptions.reduce((result, option) => {
      result[option.name] = option.type;
      return result;
    }, {});

    // Extract whitelisted options
    let options = Object.keys(config).reduce((result, optionName) => {
      if (findBy(configOptions, 'name', optionName)) {
        result[optionName] = optionTypeMap[optionName] === Array ? Array.from(config[optionName]) : config[optionName];
      } else if (findBy(availableOptions, 'name', optionName)) {
        ui.writeLine(chalk.yellow(`Warning: cannot specify option "${optionName}" in "${configPath}, ignoring`));
      } else {
        ui.writeLine(chalk.yellow(`Warning: invalid option "${optionName}" in "${configPath}", ignoring`));
      }

      return result;
    }, {});

    // If the strategy was a function, it got stomped on
    if (strategy) {
      options.strategy = strategy;
    }

    options.hooks = hooks;

    this._parsedConfig = options;
    return options;
  },

  async _proceedPrompt(message) {
    let response = await this.ui.prompt({
      type: 'confirm',
      name: 'proceed',
      message: chalk.yellow(`${message}, proceed?`),
      choices: [
        { key: 'y', value: true },
        { key: 'n', value: false }
      ]
    });

    if (!response.proceed) {
      throw new SilentError('Aborted.');
    }
  },

  async _executeHook(hookName, options) {
    if (options.hooks[hookName]) {
      await options.hooks[hookName](options);
    }
  },

  async _getTags(options) {
    let { project } = this;

    if (options.tag) {
      // Use tag name if specified
      return {
        next: options.tag
      };
    }

    // Otherwise fetch all tags to pass to the tagging strategy
    let tagNames = await options.repo.allTags();

    let { strategy } = options;
    let latest = await (strategy.getLatestTag ? strategy.getLatestTag(project, tagNames, options) : null);
    let next = await strategy.getNextTag(project, tagNames, options);

    if (typeof next !== 'string') {
      throw new Error('Tagging strategy must return a non-empty tag name');
    }

    return { latest, next };
  },

  async _promptIfWorkingTreeDirty(options) {
    let hasModifications = await options.repo.hasStagedModifications();

    if (!hasModifications || options.yes) {
      return;
    }

    await this._proceedPrompt('Your working tree contains staged, but uncommitted changes that will be added to the release commit');
  },

  async _printLatestTag(options) {
    let latestTag = options.tags.latest;

    if (latestTag) {
      this.ui.writeLine(chalk.green(`Latest tag: ${latestTag}`));
    }
  },

  async _replaceVersionInManifests(options) {
    let { manifest, project } = options;

    let filePaths = manifest.map((manifest) => path.join(project.root, manifest)).filter((filePath) => fs.existsSync(filePath));

    let nextVersion = options.tags.next;
    if (nextVersion.startsWith('v')) {
      nextVersion = nextVersion.substr(1);
    }

    filePaths.forEach((filePath) => {
      let fileContent = fs.readFileSync(filePath, 'utf-8');
      let json = JSON.parse(fileContent);
      json.version = nextVersion;
      fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf-8');
    });

    await options.repo.stageFiles(filePaths);
  },

  async _createCommit(options) {
    // Don't bother committing if for some reason the working tree is clean
    let hasModifications = await options.repo.hasStagedModifications();
    if (!hasModifications) {
      return;
    }

    let branchName = await options.repo.getCurrentBranchName();
    if (!branchName) {
      throw new SilentError('Must have a branch checked out to commit to');
    }

    // Allow the name to be in the message
    let nextTag = options.tags.next;
    let message = options.message.replace(/%@/g, nextTag);

    await options.repo.commitAll(message);

    this.ui.writeLine(chalk.green(`Successfully committed changes "${message}" locally.`));
  },

  async _promptToCreateGitTag(options) {
    let message = `About to create tag "${options.tags.next}"`;
    if (!options.local) {
      message = `${message} and push to remote ${options.remote}`;
    }
    await this._proceedPrompt(message);
  },

  async _createGitTag(options) {
    let tagName = options.tags.next;
    let tagMessage = null;

    if (options.annotation) {
      // Allow the tag name to be in the message
      tagMessage = options.annotation.replace(/%@/g, tagName);
    }

    await options.repo.createTag(tagName, tagMessage);
    this.ui.writeLine(chalk.green(`Successfully created git tag "${tagName}" locally.`));
  },

  async _pushGitChanges(options) {
    if (options.local) {
      return;
    }

    let { remote } = options;
    let branchName = await options.repo.getCurrentBranchName();
    await options.repo.pushBranch(branchName, remote);
    await options.repo.pushAllTags(remote);
  }

};

const GitRepo = require('./../utils/git-repo');
const proceedPrompt = require('./../utils/proceed-prompt');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const SilentError = require('silent-error');
const availableOptions = require('./../utils/release-command-options');

const configPath = 'config/release.js';

const availableHooks = [
  'init',
  'beforeCommit',
  'afterCommit',
  'afterCreateTag',
  'afterPush'
];

function findBy(array, prop, value) {
  return array.find((item) => item[prop] === value);
}

module.exports = {
  name: 'release',
  description: 'Create a new git tag at HEAD',
  works: 'insideProject',

  availableOptions,

  _getRepo() {
    return new GitRepo(this.project.root);
  },

  async run(commandOptions) {
    let { project, ui } = this;
    let repo = this._getRepo();
    let baseOptions = this.getConfig();

    let options = Object.assign({}, baseOptions, commandOptions);
    if (typeof options.strategy === 'string') {
      options.strategy = require(`./../strategies/${options.strategy}`);
    }

    options.repo = repo;
    options.project = project;
    options.ui = ui;

    this._options = options;

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

  _getConfigFile() {
    let { project } = this;
    let fullConfigPath = path.join(project.root, configPath);
    return fs.existsSync(fullConfigPath) ? require(fullConfigPath) : {};
  },

  getConfig() {
    if (this._parsedConfig) {
      return this._parsedConfig;
    }

    let { ui, availableOptions } = this;
    let config = this._getConfigFile();
    let strategy;

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

  async _executeHook(hookName, options) {
    if (options.hooks[hookName]) {
      await options.hooks[hookName](options);
    }
  },

  // Get the latest & next tag
  async _getTags(options) {
    if (options.tag) {
      // Use tag name if specified
      return {
        latest: undefined,
        next: options.tag
      };
    }

    // Otherwise fetch all tags to pass to the tagging strategy
    let { project } = options;
    let tagNames = await options.repo.allTags();

    let { strategy } = options;
    let latest = await (strategy.getLatestTag ? strategy.getLatestTag(project, tagNames, options) : undefined);
    let next = await strategy.getNextTag(project, tagNames, options);

    if (typeof next !== 'string') {
      throw new Error('Tagging strategy must return a non-empty tag name');
    }

    return { latest, next };
  },

  async _promptIfWorkingTreeDirty(options) {
    let hasModifications = await options.repo.hasStagedModifications();

    if (!hasModifications) {
      return;
    }

    await proceedPrompt('Your working tree contains staged, but uncommitted changes that will be added to the release commit', options);
  },

  async _printLatestTag(options) {
    let latestTag = options.tags.latest;

    if (latestTag) {
      options.ui.writeLine(chalk.green(`Latest tag: ${latestTag}`));
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

    options.ui.writeLine(chalk.green(`Successfully committed changes "${message}" locally.`));
  },

  async _promptToCreateGitTag(options) {
    let message = `About to create tag "${options.tags.next}"`;
    if (!options.local) {
      message = `${message} and push to remote ${options.remote}`;
    }
    await proceedPrompt(message, options);
  },

  async _createGitTag(options) {
    let tagName = options.tags.next;
    let tagMessage = null;

    if (options.annotation) {
      // Allow the tag name to be in the message
      tagMessage = options.annotation.replace(/%@/g, tagName);
    }

    await options.repo.createTag(tagName, tagMessage);
    options.ui.writeLine(chalk.green(`Successfully created git tag "${tagName}" locally.`));
  },

  async _pushGitChanges(options) {
    if (options.local) {
      return;
    }

    let { remote } = options;
    let branchName = await options.repo.getCurrentBranchName();
    await options.repo.pushBranch(branchName, remote);
    await options.repo.pushAllTags(remote);

    options.ui.writeLine(chalk.green(`Successfully pushed changes to ${remote}.`));
  }

};

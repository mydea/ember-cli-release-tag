const ReleaseCommand = require('./../../lib/commands/release');
const availableOptions = require('./../../lib/utils/release-command-options');
const { expect } = require('chai');
const path = require('path');
const fs = require('fs');
const rimraf = require('rimraf');
const mkdirp = require('mkdirp');
const Command = require('ember-cli/lib/models/command');
const mockUi = require('./../fixtures/mock-ui');
const mockRepo = require('./../fixtures/mock-repo');
const chalk = require('chalk');

const tmpDir = './tmp/release-tests';

function mockProject() {
  return {
    root: tmpDir,
    isEmberCLIProject() {
      return true;
    }
  };
}

function readJSONFromFile(fileName) {
  let fileContent = fs.readFileSync(path.join(tmpDir, fileName), 'UTF-8');
  return JSON.parse(fileContent);
}

function createJSONFile(fileName, json) {
  let fileContent = JSON.stringify(json);
  fs.writeFileSync(path.join(tmpDir, fileName), fileContent, 'UTF-8');
}

function getOptions(options = {}) {
  let defaults = availableOptions.reduce((defaults, option) => {
    if (typeof option.default !== 'undefined') {
      defaults[option.name] = option.default;
    }

    return defaults;
  }, {});

  return Object.assign(defaults, options);
}

function createCommand(options = {}) {
  let mergedOptions = {};
  Object.assign(mergedOptions, {
    ui: mockUi(),
    project: mockProject(),
    _getRepo: () => mockRepo()
  }, options);

  let TestCommand = Command.extend(ReleaseCommand);
  return new TestCommand(mergedOptions);
}

describe('release command', function() {
  beforeEach(function() {
    mkdirp.sync(tmpDir)
  });

  afterEach(function() {
    rimraf.sync(tmpDir);
  });

  it('it works with default settings', async function() {
    let options = getOptions();

    // First put the example en.po in the output folder
    createJSONFile('package.json', { version: '0.0.0', author: 'Francesco Novy' });

    let cmd = createCommand();
    await cmd.run(options);

    let packageJson = readJSONFromFile('package.json');

    expect(packageJson).to.deep.equals({ version: '0.1.0', author: 'Francesco Novy' });

    expect(cmd._options.ui._messages).to.deep.equal([
      chalk.yellow('About to create tag "v0.1.0" and push to remote origin, proceed?'),
      chalk.green('Successfully created git tag "v0.1.0" locally.'),
      chalk.green('Successfully pushed changes to origin.')
    ]);
  });

  it('it works with uncommitted, staged changes', async function() {
    let options = getOptions();

    // First put the example en.po in the output folder
    createJSONFile('package.json', { version: '0.0.0', author: 'Francesco Novy' });

    let repo = mockRepo();
    repo.hasStagedModifications = () => true;

    let cmd = createCommand({ _getRepo: () => repo });
    await cmd.run(options);

    let packageJson = readJSONFromFile('package.json');

    expect(packageJson).to.deep.equals({ version: '0.1.0', author: 'Francesco Novy' });

    expect(cmd._options.ui._messages).to.deep.equal([
      chalk.yellow('Your working tree contains staged, but uncommitted changes that will be added to the release commit, proceed?'),
      chalk.green('Successfully committed changes "Released v0.1.0" locally.'),
      chalk.yellow('About to create tag "v0.1.0" and push to remote origin, proceed?'),
      chalk.green('Successfully created git tag "v0.1.0" locally.'),
      chalk.green('Successfully pushed changes to origin.')
    ]);
  });

  it('it works with local setting', async function() {
    let options = getOptions({ local: true });

    // First put the example en.po in the output folder
    createJSONFile('package.json', { version: '0.0.0', author: 'Francesco Novy' });

    let cmd = createCommand();
    await cmd.run(options);

    let packageJson = readJSONFromFile('package.json');

    expect(packageJson).to.deep.equals({ version: '0.1.0', author: 'Francesco Novy' });

    expect(cmd._options.ui._messages).to.deep.equal([
      chalk.yellow('About to create tag "v0.1.0", proceed?'),
      chalk.green('Successfully created git tag "v0.1.0" locally.')
    ]);
  });

  it('hooks work', async function() {
    let options = getOptions();

    // First put the example en.po in the output folder
    createJSONFile('package.json', { version: '0.0.0', author: 'Francesco Novy' });

    let hooksInvoked = [];

    let releaseConfig = {
      init() {
        hooksInvoked.push('init');
      },
      beforeCommit() {
        hooksInvoked.push('beforeCommit');
      },
      afterCommit() {
        hooksInvoked.push('afterCommit');
      },
      afterCreateTag() {
        hooksInvoked.push('afterCreateTag');
      },
      afterPush() {
        hooksInvoked.push('afterPush');
      }
    };

    let cmd = createCommand({ _getConfigFile: () => releaseConfig });
    await cmd.run(options);

    expect(hooksInvoked).to.deep.equal([
      'init',
      'beforeCommit',
      'afterCommit',
      'afterCreateTag',
      'afterPush'
    ]);
  });

});

const { expect } = require('chai');
const { _promptToCommit } = require('./../../../lib/commands/release');
const mockUi = require('./../../fixtures/mock-ui');
const mockRepo = require('./../../fixtures/mock-repo');
const chalk = require('chalk');

describe('release command > _promptToCommit', function() {
  it('it works with local=false & no changes to commit', async function() {
    let ui = mockUi();
    let options = {
      local: false,
      ui,
      repo: mockRepo(),
      remote: 'origin',
      tags: { next: 'v1.0.0' }
    };

    await _promptToCommit(options);

    expect(ui._messages).to.deep.equal([
      chalk.yellow('About to create git tag "v1.0.0", and push to remote origin, proceed?')
    ]);
  });

  it('it works with local=true & no changes to commit', async function() {
    let ui = mockUi();
    let options = {
      local: true,
      repo: mockRepo(),
      ui,
      tags: { next: 'v1.0.0' }
    };

    await _promptToCommit(options);

    expect(ui._messages).to.deep.equal([
      chalk.yellow('About to create git tag "v1.0.0", proceed?')
    ]);
  });

  it('it works with local=false & changes to commit', async function() {
    let ui = mockUi();
    let repo = mockRepo();
    repo.hasStagedModifications = () => true;

    let options = {
      local: false,
      ui,
      repo,
      remote: 'origin',
      tags: { next: 'v1.0.0' }
    };

    await _promptToCommit(options);

    expect(ui._messages).to.deep.equal([
      chalk.yellow('About to create a release commit, create git tag "v1.0.0", and push to remote origin, proceed?')
    ]);
  });

  it('it works with local=true & changes to commit', async function() {
    let ui = mockUi();
    let repo = mockRepo();
    repo.hasStagedModifications = () => true;

    let options = {
      local: true,
      repo,
      ui,
      tags: { next: 'v1.0.0' }
    };

    await _promptToCommit(options);

    expect(ui._messages).to.deep.equal([
      chalk.yellow('About to create a release commit, create git tag "v1.0.0", proceed?')
    ]);
  });

  it('it allows to abort', async function() {
    let ui = mockUi();
    ui.prompt = async function() {
      return { proceed: false };
    };

    let options = {
      tags: { next: 'v1.0.0' },
      repo: mockRepo(),
      ui
    };

    await expect(_promptToCommit(options)).to.be.rejectedWith('Aborted.');
  });
});

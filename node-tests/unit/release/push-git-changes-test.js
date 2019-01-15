const { expect } = require('chai');
const { _pushGitChanges } = require('./../../../lib/commands/release');
const mockUi = require('./../../fixtures/mock-ui');
const mockRepo = require('./../../fixtures/mock-repo');
const chalk = require('chalk');

describe('release command > _pushGitChanges', function() {
  it('it works with local option', async function() {
    let options = {
      local: true
    };

    await _pushGitChanges(options);
  });

  it('it works without local option', async function() {
    let repo = mockRepo();
    repo.getCurrentBranchName = () => 'develop';

    repo.pushBranch = (branchName, remote) => {
      expect(branchName).to.equal('develop');
      expect(remote).to.equal('test-remote');
    };
    repo.pushAllTags = (remote) => {
      expect(remote).to.equal('test-remote');
    };

    let ui = mockUi();
    let options = {
      local: false,
      remote: 'test-remote',
      repo,
      ui
    };

    await _pushGitChanges(options);

    expect(ui._messages).to.deep.equal([
      chalk.green('Successfully pushed changes to test-remote.')
    ]);
  });
});

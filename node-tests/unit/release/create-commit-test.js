const { expect } = require('chai');
const { _createCommit } = require('./../../../lib/commands/release');
const mockUi = require('./../../fixtures/mock-ui');
const mockRepo = require('./../../fixtures/mock-repo');
const chalk = require('chalk');

describe('release command > _createCommit', function() {
  it('it works with no staged changes', async function() {
    let options = {
      repo: mockRepo()
    };

    await _createCommit(options);
  });

  it('it works with staged changes', async function() {
    let repo = mockRepo();
    repo.hasStagedModifications = () => true;

    let ui = mockUi();

    let options = {
      repo,
      ui,
      tags: { next: 'v1.0.0' },
      message: 'Released %@'
    };

    await _createCommit(options);

    expect(ui._messages).to.deep.equal([
      chalk.green('Successfully committed changes "Released v1.0.0" locally.')
    ]);
  });
});

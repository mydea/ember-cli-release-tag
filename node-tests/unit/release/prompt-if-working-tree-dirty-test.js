const { expect } = require('chai');
const { _promptIfWorkingTreeDirty } = require('./../../../lib/commands/release');
const mockRepo = require('./../../fixtures/mock-repo');
const mockUi = require('./../../fixtures/mock-ui');

describe('release command > _promptIfWorkingTreeDirty', function() {
  it('it works without modifications', async function() {
    let repo = mockRepo();
    repo.hasStagedModifications = () => false;

    let options = {
      repo
    };

    await _promptIfWorkingTreeDirty(options);
  });

  it('it works with modifications', async function() {
    let repo = mockRepo();
    repo.hasStagedModifications = () => true;

    let options = {
      repo,
      ui: mockUi()
    };

    await _promptIfWorkingTreeDirty(options);
  });

  it('it works with modifications, if aborted', async function() {
    let repo = mockRepo();
    repo.hasStagedModifications = () => true;

    let ui = mockUi();
    ui.prompt = async function() {
      return { proceed: false };
    };

    let options = {
      repo,
      ui
    };

    await expect(_promptIfWorkingTreeDirty(options)).to.be.rejectedWith('Aborted.');
  });
});

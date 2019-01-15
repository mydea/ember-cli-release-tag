const { expect } = require('chai');
const { _createGitTag } = require('./../../../lib/commands/release');
const mockRepo = require('./../../fixtures/mock-repo');
const mockUi = require('./../../fixtures/mock-ui');
const chalk = require('chalk');

describe('release command > _createGitTag', function() {
  it('it works without an annotation', async function() {
    let repo = mockRepo();
    repo.createTag = (tagName, tagMessage) => {
      expect(tagName).to.equal('v1.0.0');
      expect(tagMessage).to.equal(null);
    };

    let ui = mockUi();
    let options = {
      repo,
      ui,
      tags: { next: 'v1.0.0' }
    };

    await _createGitTag(options);

    expect(ui._messages).to.deep.equal([
      chalk.green('Successfully created git tag "v1.0.0" locally.')
    ]);
  });

  it('it works with an annotation', async function() {
    let repo = mockRepo();
    repo.createTag = (tagName, tagMessage) => {
      expect(tagName).to.equal('v1.0.0');
      expect(tagMessage).to.equal('test annotation v1.0.0');
    };

    let ui = mockUi();
    let options = {
      repo,
      ui,
      annotation: 'test annotation %@',
      tags: { next: 'v1.0.0' }
    };

    await _createGitTag(options);

    expect(ui._messages).to.deep.equal([
      chalk.green('Successfully created git tag "v1.0.0" locally.')
    ]);
  });
});

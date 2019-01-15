const { expect } = require('chai');
const { _printLatestTag } = require('./../../../lib/commands/release');
const mockUi = require('./../../fixtures/mock-ui');
const chalk = require('chalk');

describe('release command > _printLatestTag', function() {
  it('it works with no tag', async function() {
    let ui = mockUi();

    let options = {
      ui,
      tags: {}
    };

    await _printLatestTag(options);

    expect(ui._messages).to.deep.equal([]);
  });

  it('it works with a tag', async function() {
    let ui = mockUi();

    let options = {
      ui,
      tags: { latest: 'test-latest' }
    };

    await _printLatestTag(options);

    expect(ui._messages).to.deep.equal([chalk.green('Latest tag: test-latest')]);
  });
});

const { expect } = require('chai');
const { _promptToCreateGitTag } = require('./../../../lib/commands/release');
const mockUi = require('./../../fixtures/mock-ui');
const chalk = require('chalk');

describe('release command > _promptToCreateGitTag', function() {
  it('it works without local option', async function() {
    let ui = mockUi();
    let options = {
      local: false,
      ui,
      remote: 'origin',
      tags: { next: 'v1.0.0' }
    };

    await _promptToCreateGitTag(options);

    expect(ui._messages).to.deep.equal([
      chalk.yellow('About to create tag "v1.0.0" and push to remote origin, proceed?')
    ]);
  });

  it('it works with local option', async function() {
    let ui = mockUi();
    let options = {
      local: true,
      ui,
      tags: { next: 'v1.0.0' }
    };

    await _promptToCreateGitTag(options);

    expect(ui._messages).to.deep.equal([
      chalk.yellow('About to create tag "v1.0.0", proceed?')
    ]);
  });

  it('it allows to abort', async function() {
    let ui = mockUi();
    ui.prompt = async function() {
      return { proceed: false };
    };

    let options = {
      tags: { next: 'v1.0.0' },
      ui
    };

    await expect(_promptToCreateGitTag(options)).to.be.rejectedWith('Aborted.');
  });
});

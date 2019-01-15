const chalk = require('chalk');
const SilentError = require('silent-error');

module.exports = async function proceedPrompt(message, options) {
  if (options.yes) {
    return;
  }

  let response = await options.ui.prompt({
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
};

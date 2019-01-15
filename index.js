'use strict';

module.exports = {
  name: require('./package').name,

  includedCommands() {
    return {
      'release': require('./lib/commands/release')
    };
  }
};

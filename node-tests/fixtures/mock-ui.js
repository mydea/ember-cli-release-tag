module.exports = function() {
  return {
    _messages: [],
    async prompt(opts) {
      this._messages.push(opts.message);
      return { proceed: true };
    },
    writeLine(message) {
      this._messages.push(message);
    }
  }
};

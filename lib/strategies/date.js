module.exports = {

  getNextTag(project, tags) {
    let date = this.getCurrentDate();

    let year = date
      .getUTCFullYear()
      .toString()
      .substr(-2);

    let month = date.getUTCMonth() + 1;
    if (month < 10) {
      month = `0${month}`;
    }

    let baseTag = `${year}.${month}`;
    let tag = `v${baseTag}.0`;
    let i = 1;
    while (tags.includes(tag)) {
      tag = `${baseTag}.${i++}`;
    }

    return tag;
  },

  // Expose for testing :(
  getCurrentDate() {
    return new Date();
  }
};

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

    let day = date.getUTCDate();
    if (day < 10) {
      day = `0${day}`;
    }

    let baseTag = `${year}.${month}.${day}`;
    let tag = `v${baseTag}`;
    let i = 1;
    while (tags.includes(tag)) {
      tag = `v${baseTag}.${i++}`;
    }

    return tag;
  },

  // Expose for testing
  getCurrentDate() {
    return new Date();
  }
};

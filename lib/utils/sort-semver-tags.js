const semver = require('semver');

module.exports = function sortSemverTags(tags) {
  return tags
    .map((tagName) => {
      return tagName.startsWith('v') ? tagName.substr(1) : tagName;
    })
    .filter((tagName) => {
      return semver.valid(tagName);
    })
    .sort(semver.compare)
    .reverse();
}

const semver = require('semver');
const sortSemverTags = require('./../utils/sort-semver-tags');

const initialVersion = '0.1.0';

module.exports = {
  getLatestTag(project, tags) {
    let versions = sortSemverTags(tags);

    let latestVersion = versions[0];
    let hasPrefix = tags.includes(`v${latestVersion}`);

    // If tags use a prefix, prepend it to the tag
    return hasPrefix ? `v${latestVersion}` : latestVersion;
  },

  getNextTag(project, tags, options) {
    let latestTag = this.getLatestTag(project, tags);

    if (tags.length && !latestTag) {
      throw 'The repository has no tags that are SemVer compliant, you must specify a tag name with the --tag option.';
    }

    // First tag...
    if (!latestTag) {
      return `v${initialVersion}`;
    }

    let releaseType = 'patch';
    let prereleaseName;

    if (options.major) {
      releaseType = 'major';
    } else if (options.minor) {
      releaseType = 'minor';
    }

    if (options.prerelease) {
      // Option parsing doesn't distinguish between string/boolean when no value is given
      prereleaseName = options.prerelease !== 'true' ? options.prerelease : 'beta';

      if (releaseType === 'major') {
        releaseType = 'premajor';
      } else if (releaseType === 'minor') {
        releaseType = 'preminor';
      } else {
        releaseType = 'prerelease';
      }
    }

    let latestVersion = latestTag.startsWith('v') ? latestTag.substr(1) : latestTag;

    let nextVersion = semver.inc(latestVersion, releaseType, prereleaseName);
    let hasPrefix = tags.includes(`v${latestVersion}`);

    return hasPrefix ? `v${nextVersion}` : nextVersion;
  }
};

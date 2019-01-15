const semver = require('semver');

const initialVersion = '0.1.0';

const semverStrategy = {
  getLatestTag(project, tags) {
    let versions = tags
      .map((tagName) => {
        return tagName.startsWith('v') ? tagName.substr(1) : tagName;
      })
      .filter((tagName) => {
        return semver.valid(tagName);
      })
      .sort(semver.compare)
      .reverse();

    let latestVersion = versions[0];
    let hasPrefix = tags.includes(`v${latestVersion}`);

    // If tags use a prefix, prepend it to the tag
    return hasPrefix ? `v${latestVersion}` : latestVersion;
  },

  getNextTag(project, tags, options) {
    let latestTag = semverStrategy.getLatestTag(project, tags);

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
    } else if (options.prerelease) {
      releaseType = 'prerelease';
      // Option parsing doesn't distinguish between string/boolean when no value is given
      prereleaseName = options.prerelease !== 'true' ? options.prerelease : 'beta';
    }

    let latestVersion = latestTag.startsWith('v') ? latestTag.substr(1) : latestTag;

    let nextVersion = semver.inc(latestVersion, releaseType, prereleaseName);
    let hasPrefix = tags.includes(`v${latestVersion}`);

    return hasPrefix ? `v${nextVersion}` : nextVersion;
  }
};

module.exports = semverStrategy;

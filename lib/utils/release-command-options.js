module.exports = [
  {
    name: 'local',
    type: Boolean,
    aliases: ['l'],
    default: false,
    description: 'whether release commit and tags are locally or not (not pushed to a remote)',
    validInConfig: true
  },
  {
    name: 'remote',
    type: String,
    aliases: ['r'],
    default: 'origin',
    description: 'the git origin to push tags to, ignored if the \'--local\' option is true',
    validInConfig: true
  },
  {
    name: 'tag',
    type: String,
    aliases: ['t'],
    description: 'the name of the git tag to create'
  },
  {
    name: 'annotation',
    type: String,
    aliases: ['a'],
    description: 'a message passed to the `--message` option of `git tag`, indicating that to the tag should be created with the `--annotated` option (default is lightweight), the string \'%@\' is replaced with the tag name',
    validInConfig: true
  },
  {
    name: 'message',
    type: String,
    aliases: ['m'],
    default: 'Released %@',
    description: 'a message passed to the `--message` option of `git commit`, the string \'%@\' is replaced with the tag name',
    validInConfig: true
  },
  {
    name: 'manifest',
    type: Array,
    default: ['package.json'],
    description: 'a set of JSON files to replace the top-level `version` property in with the new tag name',
    validInConfig: true
  },
  {
    name: 'yes',
    type: Boolean,
    aliases: ['y'],
    default: false,
    description: 'whether to skip confirmation prompts or not (answer \'yes\' to all questions)'
  },
  {
    name: 'strategy',
    type: String,
    aliases: ['s'],
    default: 'semver',
    description: 'strategy for auto-generating the tag name, either \'semver\' or \'date\', ignored if the \'name\' option is specified',
    validInConfig: true
  },
  {
    name: 'major',
    type: Boolean,
    aliases: ['j'],
    description: 'specifies that the major version number should be incremented'
  },
  {
    name: 'minor',
    type: Boolean,
    aliases: ['i'],
    description: 'specifies that the minor version number should be incremented, ignored if \'--major\' option is true'
  },
  {
    name: 'prerelease',
    type: [String, Boolean],
    aliases: ['e'],
    description: 'specifies that the named pre-release version number should be incremented'
  }
];

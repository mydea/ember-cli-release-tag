ember-cli-release-tag
==============================================================================

Easily create Git release tags for your apps and addons.

This is a modern re-imagination of [ember-cli-release](https://github.com/shipshapecode/ember-cli-release).


Compatibility
------------------------------------------------------------------------------

* Requires Node 8 or above


Installation
------------------------------------------------------------------------------

```
ember install ember-cli-release-tag
```


Usage
------------------------------------------------------------------------------

### Semver

By default, it will create version tags based on Semver.

* `ember release` - Create a patch level release (e.g. v0.0.X)
* `ember release --minor` - Create a minor level release (e.g. v0.X.0)
* `ember release --major` - Create a major level release (e.g. vX.0.0)
* `ember release --major --prerelease='beta'` - Create a new premajor version (e.g. vX.0.0-beta.0)

### Date

Alternatively, you can also use a date strategy:

`ember release --strategy=date`

This creates a new version for the current date, e.g `v19.01.15`. If you have already released that day, it will append to it, e.g. `v19.01.15.1`.

### Custom

You can also provide a custom function as strategy, in the `config/release.js` file.
Example:

```js
// config/release.js
module.exports = {
  async strategy(project, tags, options) {
    return await getCustomNextVersion(tags);
  }
}
```

Configuration
------------------------------------------------------------------------------

You can see all available configuration options via `ember help release`. You can pass configuration on the command line, or put them in the `config/release.js` file. These are the available options:

```js
// config/release.js
module.exports = {
  local: false, // Do not auto-push git commits/tags
  remote: 'origin', // Remote name to push to
  tag: 'v1.1.0', // If set, use this tag instead of strategy
  annotation: '', // Additional message added to the git tag
  manifest: ['package.json'], // Adapt the version in these files
  yes: false, // If true, skip all confirmation dialogs
  strategy: 'semver', // Can be semver, date, or (async) function
  major: false, // Used for semver only
  minor: false, // Used for semver only
  prerelease: 'beta' // Used for semver only
};
```

License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).

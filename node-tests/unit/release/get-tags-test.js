const { expect } = require('chai');
const { _getTags } = require('./../../../lib/commands/release');
const semverStrategy = require('./../../../lib/strategies/semver');
const dateStrategy = require('./../../../lib/strategies/date');
const mockRepo = require('./../../fixtures/mock-repo');

describe('release command > _getTags', function() {
  it('it works with a specified tag option', async function() {
    let options = { tag: 'v1.0.0' };
    let tags = await _getTags(options);

    expect(tags).to.deep.equal({ latest: undefined, next: 'v1.0.0' });
  });

  it('it works with a custom strategy', async function() {
    let options = {
      repo: mockRepo(),
      strategy: {
        getLatestTag() {
          return 'custom-latest';
        },
        getNextTag() {
          return 'custom-next';
        }
      }
    };
    let tags = await _getTags(options);

    expect(tags).to.deep.equal({ latest: 'custom-latest', next: 'custom-next' });
  });

  describe('semver strategy', function() {
    it('it works with no previous tags', async function() {
      let options = {
        repo: mockRepo(),
        strategy: semverStrategy
      };
      let tags = await _getTags(options);

      expect(tags).to.deep.equal({ latest: undefined, next: 'v0.1.0' });
    });

    it('it works with previous tags', async function() {
      let repo = mockRepo();
      repo.allTags = () => ['v0.0.1', 'v0.2.0', 'v0.2.1', 'v0.1.0', 'other-tag-here'];

      let options = {
        repo,
        strategy: semverStrategy
      };
      let tags = await _getTags(options);

      expect(tags).to.deep.equal({ latest: 'v0.2.1', next: 'v0.2.2' });
    });

    it('it works with previous tags & minor option', async function() {
      let repo = mockRepo();
      repo.allTags = () => ['v0.0.1', 'v0.2.0', 'v0.2.1', 'v0.1.0', 'other-tag-here'];

      let options = {
        repo,
        strategy: semverStrategy,
        minor: true
      };
      let tags = await _getTags(options);

      expect(tags).to.deep.equal({ latest: 'v0.2.1', next: 'v0.3.0' });
    });

    it('it works with previous tags & major option', async function() {
      let repo = mockRepo();
      repo.allTags = () => ['v0.0.1', 'v0.2.0', 'v0.2.1', 'v0.1.0', 'other-tag-here'];

      let options = {
        repo,
        strategy: semverStrategy,
        major: true
      };
      let tags = await _getTags(options);

      expect(tags).to.deep.equal({ latest: 'v0.2.1', next: 'v1.0.0' });
    });

    it('it works with previous tags & prerelease option', async function() {
      let repo = mockRepo();
      repo.allTags = () => ['v0.0.1', 'v0.2.0', 'v0.2.1', 'v0.1.0', 'other-tag-here'];

      let options = {
        repo,
        strategy: semverStrategy,
        prerelease: 'beta'
      };
      let tags = await _getTags(options);

      expect(tags).to.deep.equal({ latest: 'v0.2.1', next: 'v0.2.2-beta.0' });
    });

    it('it works with previous tags & minor & prerelease option', async function() {
      let repo = mockRepo();
      repo.allTags = () => ['v0.0.1', 'v0.2.0', 'v0.2.1', 'v0.1.0', 'other-tag-here'];

      let options = {
        repo,
        strategy: semverStrategy,
        prerelease: 'beta',
        minor: true
      };
      let tags = await _getTags(options);

      expect(tags).to.deep.equal({ latest: 'v0.2.1', next: 'v0.3.0-beta.0' });
    });

    it('it works with previous tags & major & prerelease option', async function() {
      let repo = mockRepo();
      repo.allTags = () => ['v0.0.1', 'v0.2.0', 'v0.2.1', 'v0.1.0', 'other-tag-here'];

      let options = {
        repo,
        strategy: semverStrategy,
        prerelease: 'beta',
        major: true
      };
      let tags = await _getTags(options);

      expect(tags).to.deep.equal({ latest: 'v0.2.1', next: 'v1.0.0-beta.0' });
    });

    it('it works with previous prerelease version & prerelease option', async function() {
      let repo = mockRepo();
      repo.allTags = () => ['v0.0.1', 'v0.2.0', 'v0.2.1-beta.0', 'v0.1.0', 'other-tag-here'];

      let options = {
        repo,
        strategy: semverStrategy,
        prerelease: 'beta'
      };
      let tags = await _getTags(options);

      expect(tags).to.deep.equal({ latest: 'v0.2.1-beta.0', next: 'v0.2.1-beta.1' });
    });

    it('it works with previous prerelease version', async function() {
      let repo = mockRepo();
      repo.allTags = () => ['v0.0.1', 'v0.2.0', 'v0.2.1-beta.0', 'v0.1.0', 'other-tag-here'];

      let options = {
        repo,
        strategy: semverStrategy
      };
      let tags = await _getTags(options);

      expect(tags).to.deep.equal({ latest: 'v0.2.1-beta.0', next: 'v0.2.1' });
    });
  });

  describe('date strategy', function() {
    it('it works for 2019-01-15', async function() {
      let strategy = Object.assign({}, dateStrategy, {
        getCurrentDate() {
          return new Date('2019-01-15');
        }
      });
      let options = {
        repo: mockRepo(),
        strategy
      };
      let tags = await _getTags(options);

      expect(tags).to.deep.equal({ latest: undefined, next: 'v19.01.15' });
    });

    it('it works for 2019-01-02', async function() {
      let strategy = Object.assign({}, dateStrategy, {
        getCurrentDate() {
          return new Date('2019-01-02');
        }
      });
      let options = {
        repo: mockRepo(),
        strategy
      };
      let tags = await _getTags(options);

      expect(tags).to.deep.equal({ latest: undefined, next: 'v19.01.02' });
    });

    it('it works for 2019-10-10', async function() {
      let strategy = Object.assign({}, dateStrategy, {
        getCurrentDate() {
          return new Date('2019-10-10');
        }
      });
      let options = {
        repo: mockRepo(),
        strategy
      };
      let tags = await _getTags(options);

      expect(tags).to.deep.equal({ latest: undefined, next: 'v19.10.10' });
    });

    it('it works with previous tags on same date', async function() {
      let repo = mockRepo();
      repo.allTags = () => ['v0.0.1', 'v0.2.0', 'v0.2.1', 'v19.10.10', 'other-tag-here'];

      let strategy = Object.assign({}, dateStrategy, {
        getCurrentDate() {
          return new Date('2019-10-10');
        }
      });

      let options = {
        repo,
        strategy
      };
      let tags = await _getTags(options);

      expect(tags).to.deep.equal({ latest: undefined, next: 'v19.10.10.1' });
    });

    it('it works with multiple previous tags on same date', async function() {
      let repo = mockRepo();
      repo.allTags = () => ['v0.0.1', 'v0.2.0', 'v19.10.10.1', 'v19.10.10', 'other-tag-here', 'v19.10.10.2'];

      let strategy = Object.assign({}, dateStrategy, {
        getCurrentDate() {
          return new Date('2019-10-10');
        }
      });

      let options = {
        repo,
        strategy
      };
      let tags = await _getTags(options);

      expect(tags).to.deep.equal({ latest: undefined, next: 'v19.10.10.3' });
    });
  });
});

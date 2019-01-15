const { expect } = require('chai');
const { _replaceVersionInManifests } = require('./../../../lib/commands/release');
const rimraf = require('rimraf');
const mkdirp = require('mkdirp');
const fs = require('fs');
const path = require('path');
const mockRepo = require('./../../fixtures/mock-repo');

const tmpDir = './tmp/manifest-tests';

function readJSONFromFile(fileName) {
  let fileContent = fs.readFileSync(path.join(tmpDir, fileName), 'UTF-8');
  return JSON.parse(fileContent);
}

function createJSONFile(fileName, json) {
  let fileContent = JSON.stringify(json);
  fs.writeFileSync(path.join(tmpDir, fileName), fileContent, 'UTF-8');
}

function mockProject() {
  return {
    root: tmpDir
  };
}

describe('release command > _replaceVersionInManifests', function() {
  beforeEach(function() {
    mkdirp.sync(tmpDir)
  });

  afterEach(function() {
    rimraf.sync(tmpDir);
  });

  it('it works with a single manifest file', async function() {
    let options = {
      manifest: ['test-json.json'],
      tags: { next: 'v1.0.0' },
      repo: mockRepo(),
      project: mockProject()
    };

    createJSONFile('test-json.json', { version: '0.0.0' });

    await _replaceVersionInManifests(options);

    let json = readJSONFromFile('test-json.json');
    expect(json).to.deep.equal({ version: '1.0.0' });
  });

  it('it works with multiple manifest files', async function() {
    let options = {
      manifest: ['test-json.json', 'other-json.json'],
      tags: { next: 'v1.0.0' },
      repo: mockRepo(),
      project: mockProject()
    };

    createJSONFile('test-json.json', { version: '0.0.0' });
    createJSONFile('other-json.json', { version: '0.1.0' });

    await _replaceVersionInManifests(options);

    let json1 = readJSONFromFile('test-json.json');
    let json2 = readJSONFromFile('other-json.json');
    expect(json1).to.deep.equal({ version: '1.0.0' });
    expect(json2).to.deep.equal({ version: '1.0.0' });
  });

  it('it works with non-existing manifest files', async function() {
    let options = {
      manifest: ['test-json.json', 'other-json.json'],
      tags: { next: '1.0.0' },
      repo: mockRepo(),
      project: mockProject()
    };

    createJSONFile('test-json.json', { version: '0.0.0' });

    await _replaceVersionInManifests(options);

    let json = readJSONFromFile('test-json.json');
    expect(json).to.deep.equal({ version: '1.0.0' });
  });

  it('it stages changed manifest files', async function() {
    let repo = mockRepo();
    repo.stageFiles = (files) => {
      repo._stagedFiles = files;
    };

    let options = {
      manifest: ['test-json.json', 'other-json.json'],
      tags: { next: '1.0.0' },
      repo,
      project: mockProject()
    };

    createJSONFile('test-json.json', { version: '0.0.0' });

    await _replaceVersionInManifests(options);

    let json = readJSONFromFile('test-json.json');
    expect(json).to.deep.equal({ version: '1.0.0' });
    expect(repo._stagedFiles).to.deep.equal([path.join(tmpDir, 'test-json.json')]);
  });

  it('it correctly formats updated manifest file', async function() {
    let options = {
      manifest: ['test-json.json'],
      tags: { next: 'v1.0.0' },
      repo: mockRepo(),
      project: mockProject()
    };

    createJSONFile('test-json.json', { version: '0.0.0', other: true, nested: { yes: 'indeed' } });

    await _replaceVersionInManifests(options);

    let jsonString = fs.readFileSync(path.join(tmpDir, 'test-json.json'), 'UTF-8');
    expect(jsonString).to.equal(JSON.stringify({ version: '1.0.0', other: true, nested: { yes: 'indeed' } }, null, 2));
  });
});

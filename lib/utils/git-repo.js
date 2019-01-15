const simpleGit = require('simple-git/promise');

module.exports = class GitRepo {
  constructor(projectRoot) {
    this.repo = simpleGit(projectRoot);
  }

  async allTags() {
    let tags = await this.repo.tags();
    return tags.all;
  }

  async _status() {
    return await this.repo.status();
  }

  async _branchInfo() {
    return await this.repo.branchLocal();
  }

  async hasStagedModifications() {
    let status = await this._status();
    return status.staged.length > 0 || status.created.length > 0 || status.deleted.length > 0;
  }

  async getCurrentBranchName() {
    let branches = await this._branchInfo();
    return branches.current;
  }

  async commitAll(message) {
    return await this.repo.commit(message);
  }

  async createTag(tagName, tagMessage) {
    if (tagMessage) {
      return await this.repo.addAnnotatedTag(tagName, tagMessage);
    }

    return await this.repo.addTag(tagName);
  }

  async pushBranch(branchName, remote) {
    return await this.repo.push(remote, branchName);
  }

  async pushAllTags(remote) {
    return await this.repo.pushTags(remote);
  }

  async stageFiles(files) {
    return await this.repo.add(files);
  }
};

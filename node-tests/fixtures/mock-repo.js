module.exports = function() {
  return {
    async allTags() {
      return [];
    },

    async hasStagedModifications() {
      return false;
    },

    async getCurrentBranchName() {
      return 'master';
    },

    async commitAll() {
      // noop
    },

    async createTag() {
      // noop
    },

    async pushBranch() {
      // noop
    },

    async pushAllTags() {
      // noop
    },

    async stageFiles() {
      // noop
    }
  };
}

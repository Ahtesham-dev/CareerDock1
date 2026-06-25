const pipelineDedup = require('../../../pipeline/processors/deduplicator');
const legacyDedup = require('../../../scrapers/dedup');

class DeduplicationService {
  async deduplicate(jobs, options = {}) {
    return pipelineDedup.deduplicate(jobs, options);
  }

  async legacyDedup() {
    return legacyDedup.deduplicateJobs();
  }

  getStats() {
    return pipelineDedup.getStats();
  }
}

module.exports = new DeduplicationService();

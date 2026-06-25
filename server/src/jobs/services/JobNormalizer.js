const pipelineNormalizer = require('../../../pipeline/processors/normalizer');

class JobNormalizer {
  normalize(job) {
    return pipelineNormalizer.normalize(job);
  }

  normalizeBatch(jobs) {
    return jobs.map(j => this.normalize(j));
  }
}

module.exports = new JobNormalizer();

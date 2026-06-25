const JobNormalizer = require('../services/JobNormalizer');
const ValidationService = require('../services/ValidationService');
const DeduplicationService = require('../services/DeduplicationService');
const { PipelineJob } = require('../../../pipeline/models');

class JobWorker {
  async process(adapter, context = {}) {
    const start = Date.now();
    const result = { found: 0, normalized: 0, valid: 0, deduped: 0, saved: 0, errors: [] };

    try {
      const rawJobs = await adapter.fetchJobs(context);
      result.found = rawJobs.length;

      const normalized = JobNormalizer.normalizeBatch(rawJobs);
      result.normalized = normalized.length;

      const { valid, rejected } = ValidationService.filterValid(normalized);
      result.valid = valid.length;

      const { keep, duplicates } = await DeduplicationService.deduplicate(valid);
      result.deduped = duplicates.length;

      for (const job of keep) {
        try {
          await PipelineJob.findOneAndUpdate(
            { $or: [
              { hash: job.hash },
              { source: job.source, sourceJobId: job.sourceJobId }
            ].filter(Boolean) },
            { $set: { ...job, lastSeenAt: new Date(), updatedAt: new Date() },
              $setOnInsert: { createdAt: new Date() } },
            { upsert: true }
          );
          result.saved++;
        } catch (err) {
          result.errors.push(err.message);
        }
      }
    } catch (err) {
      result.errors.push(err.message);
    }

    result.duration = Date.now() - start;
    return result;
  }
}

module.exports = new JobWorker();

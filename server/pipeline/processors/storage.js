const { PipelineJob } = require('../models');
const PipelineLogger = require('../monitoring/logger');
const healthMonitor = require('../monitoring/health');

class StorageLayer {
  constructor() {
    this.logger = new PipelineLogger({ source: 'processor:storage' });
  }

  async saveJobs(jobs, source) {
    const result = { inserted: 0, updated: 0, errors: 0, expired: 0 };

    for (const job of jobs) {
      try {
        const outcome = await this._upsertJob(job, source);
        if (outcome === 'inserted') result.inserted++;
        else if (outcome === 'updated') result.updated++;
      } catch (err) {
        this.logger.error(`Storage error for "${job.title}" @ ${job.company}: ${err.message}`);
        result.errors++;
      }
    }

    this.logger.info(`Storage: ${result.inserted} new, ${result.updated} updated, ${result.errors} errors for ${source}`);
    return result;
  }

  async _upsertJob(job, source) {
    const query = this._buildQuery(job);

    if (query.sourceJobId || query.hash) {
      const existing = await PipelineJob.findOne(query).lean();
      if (existing) {
        await PipelineJob.updateOne(
          { _id: existing._id },
          {
            $set: {
              ...job,
              lastSeenAt: new Date(),
              updatedAt: new Date()
            }
          }
        );
        return 'updated';
      }
    }

    await PipelineJob.create({
      ...job,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return 'inserted';
  }

  _buildQuery(job) {
    if (job.source && job.sourceJobId) {
      return { source: job.source, sourceJobId: job.sourceJobId };
    }
    if (job.hash) {
      return { hash: job.hash };
    }
    return {
      title: job.title,
      company: job.company,
      location: job.location,
      source: job.source
    };
  }

  async markExpired(source, seenWithinDays = 7) {
    const cutoff = new Date(Date.now() - seenWithinDays * 24 * 60 * 60 * 1000);
    const result = await PipelineJob.updateMany(
      {
        source,
        active: true,
        lastSeenAt: { $lt: cutoff }
      },
      { $set: { active: false, updatedAt: new Date() } }
    );
    if (result.modifiedCount > 0) {
      this.logger.info(`Marked ${result.modifiedCount} ${source} jobs as inactive (last seen before ${cutoff.toISOString()})`);
    }
    return result.modifiedCount;
  }

  async archiveOldJobs(daysOld = 60) {
    const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    const result = await PipelineJob.deleteMany({
      active: false,
      updatedAt: { $lt: cutoff }
    });
    if (result.deletedCount > 0) {
      this.logger.info(`Archived ${result.deletedCount} old inactive jobs`);
    }
    return result.deletedCount;
  }

  async getActiveJobCount() {
    return PipelineJob.countDocuments({ active: true });
  }

  async getSourceStats(source) {
    const total = await PipelineJob.countDocuments({ source });
    const active = await PipelineJob.countDocuments({ source, active: true });
    return { source, total, active };
  }
}

module.exports = new StorageLayer();

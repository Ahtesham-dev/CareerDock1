const Job = require('../models/Job');
const ScraperRun = require('../models/ScraperRun');
const SourceHealth = require('../models/SourceHealth');

class CleanupService {
  async expireStaleJobs(days = 7) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const result = await Job.updateMany(
      { active: true, lastSeenAt: { $lt: cutoff } },
      { $set: { active: false } }
    );
    return result.modifiedCount || 0;
  }

  async archiveOldJobs(days = 60) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const result = await Job.deleteMany({ active: false, updatedAt: { $lt: cutoff } });
    return result.deletedCount || 0;
  }

  async recalculateSourceHealth() {
    const sources = await ScraperRun.distinct('source');
    let updated = 0;
    for (const source of sources) {
      const runs = await ScraperRun.find({ source }).sort({ startedAt: -1 }).limit(50).lean();
      if (runs.length === 0) continue;
      const successRuns = runs.filter(r => r.status === 'success').length;
      const failedRuns = runs.filter(r => r.status === 'failed').length;
      const totalJobsFound = runs.reduce((s, r) => s + (r.jobsFound || 0), 0);
      const totalJobsSaved = runs.reduce((s, r) => s + (r.jobsSaved || 0), 0);
      const consecutiveFailures = this._getConsecutiveFailures(runs);
      const lastRun = runs[0];
      const lastSuccess = runs.find(r => r.status === 'success');
      const avgDuration = runs.length > 0 ? runs.reduce((s, r) => s + (r.duration || 0), 0) / runs.length : 0;
      const successRate = runs.length > 0 ? Math.round((successRuns / runs.length) * 100) : 100;

      let status = 'healthy';
      if (consecutiveFailures >= 3) status = 'broken';
      else if (consecutiveFailures >= 1 || successRate < 80) status = 'warning';

      await SourceHealth.findOneAndUpdate(
        { source },
        {
          $set: {
            status,
            totalRuns: runs.length,
            successRuns,
            failedRuns,
            consecutiveFailures,
            lastRunAt: lastRun?.startedAt || null,
            lastSuccessAt: lastSuccess?.startedAt || null,
            lastError: lastRun?.status === 'failed' ? (lastRun.error || '') : '',
            totalJobsFound,
            totalJobsSaved,
            avgDuration: Math.round(avgDuration),
            successRate,
            uptime: successRate
          }
        },
        { upsert: true }
      );
      updated++;
    }
    return updated;
  }

  _getConsecutiveFailures(runs) {
    let count = 0;
    for (const run of runs) {
      if (run.status === 'failed') count++;
      else break;
    }
    return count;
  }

  async runDailyCleanup() {
    const expired = await this.expireStaleJobs(7);
    const archived = await this.archiveOldJobs(60);
    const healthUpdated = await this.recalculateSourceHealth();
    return { expired, archived, healthUpdated };
  }
}

module.exports = new CleanupService();

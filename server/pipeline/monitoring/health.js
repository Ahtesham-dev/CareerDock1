const mongoose = require('mongoose');

class HealthMonitor {
  constructor() {
    this.sources = new Map();
    this.startTime = Date.now();
    this.jobsTotal = 0;
    this.jobsAdded = 0;
  }

  recordRun(source, result) {
    const now = Date.now();
    if (!this.sources.has(source)) {
      this.sources.set(source, {
        name: source,
        totalRuns: 0,
        successRuns: 0,
        failedRuns: 0,
        lastRunAt: null,
        lastSuccessAt: null,
        lastError: null,
        totalJobsFound: 0,
        totalJobsSaved: 0,
        avgDuration: 0,
        consecutiveFailures: 0,
        uptime: 100
      });
    }

    const s = this.sources.get(source);
    s.totalRuns++;
    s.lastRunAt = new Date(now);
    s.avgDuration = (s.avgDuration * (s.totalRuns - 1) + result.duration) / s.totalRuns;
    s.totalJobsFound += result.found || 0;
    s.totalJobsSaved += result.saved || 0;

    if (result.success) {
      s.successRuns++;
      s.lastSuccessAt = new Date(now);
      s.consecutiveFailures = 0;
    } else {
      s.failedRuns++;
      s.lastError = result.error;
      s.consecutiveFailures++;
    }

    s.uptime = s.totalRuns > 0 ? Math.round((s.successRuns / s.totalRuns) * 100) : 100;
    this.jobsTotal += result.saved || 0;
    this.jobsAdded += result.found || 0;
  }

  getSourceHealth(source) {
    return this.sources.get(source) || null;
  }

  getAllHealth() {
    return {
      uptime: Math.round((Date.now() - this.startTime) / 1000),
      sources: Array.from(this.sources.values()),
      totals: {
        jobsInDb: this.jobsTotal,
        totalRuns: Array.from(this.sources.values()).reduce((a, s) => a + s.totalRuns, 0),
        totalErrors: Array.from(this.sources.values()).reduce((a, s) => a + s.failedRuns, 0),
        avgUptime: this.sources.size > 0
          ? Math.round(Array.from(this.sources.values()).reduce((a, s) => a + s.uptime, 0) / this.sources.size)
          : 100
      }
    };
  }

  async getDbStats() {
    try {
      const stats = await mongoose.connection.db.stats();
      return {
        collections: stats.collections,
        objects: stats.objects,
        avgObjSize: stats.avgObjSize,
        dataSize: stats.dataSize,
        indexes: stats.indexes,
        indexSize: stats.indexSize
      };
    } catch {
      return null;
    }
  }
}

module.exports = new HealthMonitor();

const mongoose = require('mongoose');

const sourceHealthSchema = new mongoose.Schema({
  source: { type: String, required: true, unique: true },
  status: { type: String, enum: ['healthy', 'warning', 'broken', 'unknown'], default: 'unknown' },
  totalRuns: { type: Number, default: 0 },
  successRuns: { type: Number, default: 0 },
  failedRuns: { type: Number, default: 0 },
  consecutiveFailures: { type: Number, default: 0 },
  lastRunAt: { type: Date, default: null },
  lastSuccessAt: { type: Date, default: null },
  lastError: { type: String, default: '' },
  totalJobsFound: { type: Number, default: 0 },
  totalJobsSaved: { type: Number, default: 0 },
  totalJobsRejected: { type: Number, default: 0 },
  totalDuplicatesRemoved: { type: Number, default: 0 },
  avgDuration: { type: Number, default: 0 },
  successRate: { type: Number, default: 100 },
  uptime: { type: Number, default: 100 },
  alerts: [{
    type: { type: String, enum: ['consecutive_failure', 'low_job_count', 'high_error_rate', 'long_runtime'], default: 'consecutive_failure' },
    message: String,
    triggeredAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date, default: null },
    resolved: { type: Boolean, default: false }
  }]
}, { timestamps: true });

sourceHealthSchema.index({ status: 1 });
sourceHealthSchema.index({ consecutiveFailures: -1 });

sourceHealthSchema.methods.recordRun = function (result) {
  this.totalRuns++;
  this.lastRunAt = new Date();
  this.avgDuration = (this.avgDuration * (this.totalRuns - 1) + (result.duration || 0)) / this.totalRuns;
  this.totalJobsFound += result.found || 0;
  this.totalJobsSaved += result.saved || 0;
  this.totalJobsRejected += result.rejected || 0;
  this.totalDuplicatesRemoved += result.duplicatesRemoved || 0;

  if (result.success) {
    this.successRuns++;
    this.lastSuccessAt = new Date();
    this.consecutiveFailures = 0;
    this.lastError = '';
  } else {
    this.failedRuns++;
    this.lastError = result.error || 'Unknown error';
    this.consecutiveFailures++;
  }

  this.successRate = this.totalRuns > 0 ? Math.round((this.successRuns / this.totalRuns) * 100) : 100;
  this.uptime = this.successRate;

  if (this.consecutiveFailures >= 3) {
    this.status = 'broken';
    this.alerts.push({
      type: 'consecutive_failure',
      message: `${this.source} failed ${this.consecutiveFailures} times consecutively`,
      triggeredAt: new Date()
    });
  } else if (this.consecutiveFailures >= 1) {
    this.status = 'warning';
  } else if (this.successRate >= 90) {
    this.status = 'healthy';
  } else {
    this.status = 'warning';
  }
};

module.exports = mongoose.model('SourceHealth', sourceHealthSchema);

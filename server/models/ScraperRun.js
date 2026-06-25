const mongoose = require('mongoose');

const scraperRunSchema = new mongoose.Schema({
  source: { type: String, required: true },
  status: { type: String, enum: ['running', 'success', 'failed'], default: 'running' },
  startedAt: { type: Date, default: Date.now },
  completedAt: Date,
  duration: { type: Number, default: 0 },
  jobsFound: { type: Number, default: 0 },
  jobsSaved: { type: Number, default: 0 },
  jobsRejected: { type: Number, default: 0 },
  duplicatesRemoved: { type: Number, default: 0 },
  error: { type: String, default: '' },
  errorStack: { type: String, default: '' }
});

scraperRunSchema.index({ source: 1, startedAt: -1 });

module.exports = mongoose.model('ScraperRun', scraperRunSchema);

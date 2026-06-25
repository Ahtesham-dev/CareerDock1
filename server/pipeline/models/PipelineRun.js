const mongoose = require('mongoose');

const pipelineRunSchema = new mongoose.Schema({
  pipeline: { type: String, default: 'main' },
  source: { type: String, required: true },
  status: { type: String, enum: ['running', 'success', 'failed', 'partial'], default: 'running' },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
  duration: { type: Number, default: 0 },
  jobsFound: { type: Number, default: 0 },
  jobsNew: { type: Number, default: 0 },
  jobsUpdated: { type: Number, default: 0 },
  jobsDeduped: { type: Number, default: 0 },
  jobsExpired: { type: Number, default: 0 },
  jobsRejected: { type: Number, default: 0 },
  errorMessages: { type: [String], default: [] },
  warnings: { type: [String], default: [] },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  trigger: { type: String, enum: ['scheduled', 'manual', 'startup'], default: 'scheduled' }
}, { timestamps: true, suppressReservedKeysWarning: true });

pipelineRunSchema.index({ source: 1, startedAt: -1 });
pipelineRunSchema.index({ status: 1 });
pipelineRunSchema.index({ startedAt: -1 });

module.exports = mongoose.model('PipelineRun', pipelineRunSchema);

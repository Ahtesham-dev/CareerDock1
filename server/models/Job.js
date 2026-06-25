const crypto = require('crypto');
const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, default: 'Remote' },
  type: { type: String, enum: ['Full-time', 'Remote', 'Hybrid'], default: 'Full-time' },
  experience: { type: String, enum: ['Fresher', 'Mid-level', 'Senior'], default: 'Mid-level' },
  salaryMin: { type: Number, default: 0 },
  salaryMax: { type: Number, default: 0 },
  salaryLabel: { type: String, default: '' },
  source: { type: String, required: true },
  description: { type: String, default: '' },
  skills: [String],
  applied: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  dupGroup: { type: String, default: null },
  dupFlagged: { type: Boolean, default: false },
  dupConfidence: { type: Number, default: null },
  dupMergedFrom: { type: String, default: null },
  qualityScore: { type: Number, default: null },
  qualityBreakdown: { type: mongoose.Schema.Types.Mixed, default: {} },
  postedAt: { type: Date, default: Date.now },
  externalUrl: { type: String, default: '' },
  hash: { type: String, default: '' },
  applyUrl: { type: String, default: '' },
  active: { type: Boolean, default: true, index: true },
  lastSeenAt: { type: Date, default: Date.now },
  applyUrlStatus: { type: String, enum: ['unknown', 'valid', 'invalid', 'error'], default: 'unknown' },
  lastValidatedAt: { type: Date, default: null },
  searchText: { type: String, default: '' }
}, { timestamps: true });

jobSchema.index({ postedAt: -1 });
jobSchema.index({ source: 1, postedAt: -1 });
jobSchema.index({ skills: 1 });
jobSchema.index({ qualityScore: -1 });
jobSchema.index({ dupGroup: 1 });
jobSchema.index({ dupFlagged: 1 });
jobSchema.index({ salaryMin: -1 });
jobSchema.index({ location: 1 });
jobSchema.index({ experience: 1 });
jobSchema.index({ type: 1 });
jobSchema.index({ company: 1 });
jobSchema.index({ hash: 1 }, { sparse: true });
jobSchema.index({ source: 1, sourceJobId: 1 }, { sparse: true });
jobSchema.index({ active: 1, postedAt: -1 });
jobSchema.index({ lastSeenAt: 1 });
jobSchema.index({ applyUrlStatus: 1 });
jobSchema.index({ searchText: 1 });
jobSchema.index({ active: 1, source: 1, postedAt: -1 });

module.exports = mongoose.model('Job', jobSchema);

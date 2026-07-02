const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true, index: true },
  company: { type: String, required: true, index: true },
  companySlug: { type: String, default: '' },
  location: { type: String, default: 'Remote' },
  remote: { type: Boolean, default: false },
  salaryMin: { type: Number, default: 0 },
  salaryMax: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  experience: { type: String, default: 'Mid-level' },
  skills: { type: [String], default: [] },
  description: { type: String, default: '' },
  applyUrl: { type: String, default: '' },
  source: { type: String, required: true, index: true },
  sourceJobId: { type: String, default: '' },
  postedAt: { type: Date, default: Date.now },
  lastSeenAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: null },
  logo: { type: String, default: '' },
  tags: { type: [String], default: [] },
  hash: { type: String, default: '' },
  active: { type: Boolean, default: true, index: true },
  dupGroup: { type: String, default: null },
  dupConfidence: { type: Number, default: null },
  qualityScore: { type: Number, default: null },
  qualityBreakdown: { type: mongoose.Schema.Types.Mixed, default: {} },
  validated: { type: Boolean, default: false },
  applyUrlStatus: { type: String, enum: ['unknown', 'valid', 'invalid', 'error'], default: 'unknown' },
  lastValidatedAt: { type: Date, default: null },
  searchText: { type: String, default: '' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

jobSchema.index({ postedAt: -1 });
jobSchema.index({ source: 1, postedAt: -1 });
jobSchema.index({ skills: 1 });
jobSchema.index({ qualityScore: -1 });
jobSchema.index({ dupGroup: 1 });
jobSchema.index({ hash: 1 }, { sparse: true });
jobSchema.index({ active: 1, postedAt: -1 });
jobSchema.index({ company: 1, active: 1 });
jobSchema.index({ source: 1, sourceJobId: 1 }, { unique: true, sparse: true });
jobSchema.index({ title: 1, company: 1, location: 1 });
jobSchema.index({ lastSeenAt: 1 });
jobSchema.index({ expiresAt: 1 }, { sparse: true });
jobSchema.index({ applyUrlStatus: 1 });
jobSchema.index({ active: 1, source: 1, postedAt: -1 });
jobSchema.index({
  title: 'text', company: 'text', description: 'text',
  skills: 'text', location: 'text', tags: 'text'
}, {
  weights: { title: 30, skills: 15, company: 10, description: 5, location: 3, tags: 2 },
  name: 'pipeline_job_fulltext'
});

module.exports = mongoose.model('PipelineJob', jobSchema, 'jobs');

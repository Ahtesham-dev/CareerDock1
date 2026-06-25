const mongoose = require('mongoose');

const companyRegistrySchema = new mongoose.Schema({
  name: { type: String, required: true },
  normalizedName: { type: String, index: true },
  website: { type: String, default: '' },
  careersUrl: { type: String, default: '' },
  careersPlatform: { type: String, default: 'direct' },
  industry: { type: String, default: '' },
  batch: { type: String, default: '' },
  description: { type: String, default: '' },
  logo: { type: String, default: '' },
  ycUrl: { type: String, default: '' },
  tags: { type: [String], default: [] },
  jobsLastFetched: { type: Date, default: null },
  active: { type: Boolean, default: true },
  source: { type: String, default: 'ycombinator' }
}, { timestamps: true });

companyRegistrySchema.index({ name: 1 }, { unique: true });
companyRegistrySchema.index({ careersPlatform: 1 });
companyRegistrySchema.index({ batch: 1 });
companyRegistrySchema.index({ active: 1 });

module.exports = mongoose.model('CompanyRegistry', companyRegistrySchema);

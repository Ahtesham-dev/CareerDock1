const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  normalizedName: { type: String, index: true },
  domain: String,
  description: String,
  logoUrl: String,
  website: String,
  size: { type: String, enum: ['Startup', 'Mid-size', 'Enterprise', 'Unknown'], default: 'Unknown' },
  industry: String,
  totalJobs: { type: Number, default: 0 },
  avgSalary: { type: Number, default: 0 },
  avgQualityScore: { type: Number, default: 0 },
  lastJobPosted: Date,
  sources: [String],
  aliases: [String],
  verified: { type: Boolean, default: false },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  reviews: { type: Number, default: 0 },
  lastComputed: { type: Date, default: Date.now },
}, { timestamps: true });

companySchema.index({ totalJobs: -1 });
companySchema.index({ avgQualityScore: -1 });
companySchema.index({ name: 'text', aliases: 'text' });

module.exports = mongoose.model('Company', companySchema);

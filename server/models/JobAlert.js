const mongoose = require('mongoose');

const jobAlertSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  keywords: { type: String, required: true, trim: true },
  location: { type: String, default: '', trim: true },
  minSalary: { type: Number, default: 0, min: 0 },
  employmentType: { type: String, enum: ['Full-time', 'Remote', 'Hybrid', ''], default: '' },
  isActive: { type: Boolean, default: true },
  lastCheckedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

jobAlertSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('JobAlert', jobAlertSchema);

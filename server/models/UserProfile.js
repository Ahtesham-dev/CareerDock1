const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  skills: { type: [String], default: [] },
  experienceLevel: { type: String, enum: ['Fresher', 'Mid-level', 'Senior', ''], default: '' },
  preferredLocations: { type: [String], default: [] },
  preferredJobTypes: { type: [String], enum: ['Full-time', 'Remote', 'Hybrid'], default: [] },
  preferredSalary: { type: Number, default: 0 },
  remoteOnly: { type: Boolean, default: false }
});

module.exports = mongoose.model('UserProfile', userProfileSchema);

const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company: { type: String, required: true },
  role: { type: String, required: true },
  appliedDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['Saved', 'Applied', 'Interview', 'Offer', 'Rejected'], default: 'Applied' },
  source: { type: String, default: 'LinkedIn' },
  notes: { type: String, default: '' },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', default: null }
});

module.exports = mongoose.model('Application', applicationSchema);

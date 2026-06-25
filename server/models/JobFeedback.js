const mongoose = require('mongoose');

const jobFeedbackSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  vote: { type: String, enum: ['up', 'down'], required: true },
  reason: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

jobFeedbackSchema.index({ userId: 1, jobId: 1 }, { unique: true });

module.exports = mongoose.model('JobFeedback', jobFeedbackSchema);

const mongoose = require('mongoose');

const matchLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  alertId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobAlert', required: true },
  matchedAt: { type: Date, default: Date.now },
  emailSentAt: Date,
  emailStatus: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
});

matchLogSchema.index({ userId: 1, jobId: 1, alertId: 1 }, { unique: true });

module.exports = mongoose.model('MatchLog', matchLogSchema);

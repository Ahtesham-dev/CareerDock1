const mongoose = require('mongoose');

const savedJobSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  title: String,
  company: String,
  source: String,
  salary: String,
  column: { type: String, enum: ['saved', 'applied', 'interview', 'rejected', 'offer'], default: 'saved' },
  savedAt: { type: Date, default: Date.now }
});

savedJobSchema.index({ userId: 1, jobId: 1 }, { unique: true });

module.exports = mongoose.model('SavedJob', savedJobSchema);

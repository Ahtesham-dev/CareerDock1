const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['job', 'skill', 'company', 'career_path'], required: true },
  items: [{
    targetId: { type: mongoose.Schema.Types.ObjectId },
    targetType: { type: String, enum: ['Job', 'Skill', 'Company'] },
    label: String,
    score: { type: Number, default: 0 },
    reason: String,
    metadata: mongoose.Schema.Types.Mixed,
  }],
  generatedAt: { type: Date, default: Date.now, index: { expireAfterSeconds: 86400 } },
}, { timestamps: true });

recommendationSchema.index({ userId: 1, type: 1 });
recommendationSchema.index({ 'items.score': -1 });

module.exports = mongoose.model('Recommendation', recommendationSchema);

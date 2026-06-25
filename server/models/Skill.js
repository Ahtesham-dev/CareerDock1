const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, lowercase: true, trim: true },
  category: { type: String, default: 'general', index: true },
  aliases: [String],
  demandCount: { type: Number, default: 0 },
  avgSalary: { type: Number, default: 0 },
  growthRate: { type: Number, default: 0 },
  lastComputed: { type: Date, default: Date.now },
}, { timestamps: true });

skillSchema.index({ demandCount: -1 });
skillSchema.index({ growthRate: -1 });
skillSchema.index({ name: 'text', aliases: 'text' });

module.exports = mongoose.model('Skill', skillSchema);

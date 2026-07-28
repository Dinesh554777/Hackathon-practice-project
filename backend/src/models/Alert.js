const { mongoose } = require('../db/mongoose');

const alertSchema = new mongoose.Schema({
  type: { type: String, enum: ['security', 'inventory', 'marketing', 'system'], required: true },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  title: { type: String, required: true },
  message: String,
  metadata: mongoose.Schema.Types.Mixed,
  isRead: { type: Boolean, default: false },
  isResolved: { type: Boolean, default: false },
}, { timestamps: true });

alertSchema.index({ isRead: 1, createdAt: -1 });
alertSchema.index({ type: 1, severity: 1 });

module.exports = mongoose.model('Alert', alertSchema);

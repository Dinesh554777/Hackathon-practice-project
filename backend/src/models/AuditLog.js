const { mongoose } = require('../db/mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: { type: String },
  action: { type: String, required: true },
  resource: { type: String, required: true },
  resourceId: String,
  details: mongoose.Schema.Types.Mixed,
  ip: String,
  userAgent: String,
  severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'info' },
}, { timestamps: true });

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);

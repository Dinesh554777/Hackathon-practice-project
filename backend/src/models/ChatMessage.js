const { mongoose } = require('../db/mongoose');

const chatMessageSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  userId: { type: String },
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
  metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

chatMessageSchema.index({ sessionId: 1, createdAt: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);

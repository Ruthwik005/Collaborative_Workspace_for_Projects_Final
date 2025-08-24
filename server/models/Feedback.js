const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['comment', 'status-change', 'assignment', 'attachment'],
    default: 'comment'
  },
  metadata: {
    oldValue: String,
    newValue: String,
    attachment: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
feedbackSchema.index({ taskId: 1, createdAt: -1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
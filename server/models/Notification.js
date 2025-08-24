const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['task', 'github', 'meeting', 'report', 'system'],
    default: 'task'
  },
  read: {
    type: Boolean,
    default: false
  },
  data: {
    taskId: mongoose.Schema.Types.ObjectId,
    meetingId: mongoose.Schema.Types.ObjectId,
    githubEvent: String,
    reportUrl: String
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
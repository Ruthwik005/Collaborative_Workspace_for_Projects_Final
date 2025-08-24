const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'done'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dueDate: {
    type: Date
  },
  tags: [String],
  githubIssueId: String,
  githubRepo: String,
  googleDocUrl: String,
  attachments: [{
    filename: String,
    path: String,
    uploadedAt: Date
  }]
}, {
  timestamps: true
});

// Index for efficient queries
taskSchema.index({ status: 1, assignee: 1, dueDate: 1 });

module.exports = mongoose.model('Task', taskSchema);
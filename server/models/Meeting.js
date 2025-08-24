const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  attendees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    type: String,
    default: ''
  },
  meetingType: {
    type: String,
    enum: ['in-person', 'video', 'hybrid'],
    default: 'video'
  },
  googleCalendarEventId: String,
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled'
  }
}, {
  timestamps: true
});

// Index for efficient queries
meetingSchema.index({ startTime: 1, attendees: 1 });

module.exports = mongoose.model('Meeting', meetingSchema);
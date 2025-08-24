const express = require('express');
const Meeting = require('../models/Meeting');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all meetings
router.get('/', auth, async (req, res) => {
  try {
    const meetings = await Meeting.find({
      $or: [
        { organizer: req.user._id },
        { attendees: req.user._id }
      ]
    })
    .populate('attendees', 'username avatar email')
    .populate('organizer', 'username avatar')
    .sort({ startTime: 1 });
    
    res.json(meetings);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching meetings' });
  }
});

// Create new meeting
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, startTime, endTime, attendees, location, meetingType } = req.body;
    
    // Auto-assign all team members if no specific attendees
    let finalAttendees = attendees;
    if (!attendees || attendees.length === 0) {
      const allUsers = await User.find({ isActive: true });
      finalAttendees = allUsers.map(user => user._id);
    }
    
    const meeting = new Meeting({
      title,
      description,
      startTime,
      endTime,
      attendees: finalAttendees,
      organizer: req.user._id,
      location,
      meetingType
    });
    
    await meeting.save();
    
    // Populate attendees and organizer for response
    await meeting.populate('attendees', 'username avatar email');
    await meeting.populate('organizer', 'username avatar');
    
    // Emit socket event
    req.app.get('io').emit('meeting-created', meeting);
    
    res.status(201).json(meeting);
  } catch (error) {
    res.status(500).json({ error: 'Error creating meeting' });
  }
});

// Update meeting
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const meeting = await Meeting.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('attendees', 'username avatar email')
    .populate('organizer', 'username avatar');
    
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    
    // Emit socket event
    req.app.get('io').emit('meeting-updated', meeting);
    
    res.json(meeting);
  } catch (error) {
    res.status(500).json({ error: 'Error updating meeting' });
  }
});

// Delete meeting
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const meeting = await Meeting.findById(id);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    
    // Only organizer can delete meeting
    if (meeting.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only organizer can delete meeting' });
    }
    
    await Meeting.findByIdAndDelete(id);
    
    // Emit socket event
    req.app.get('io').emit('meeting-deleted', { id });
    
    res.json({ message: 'Meeting deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting meeting' });
  }
});

module.exports = router;
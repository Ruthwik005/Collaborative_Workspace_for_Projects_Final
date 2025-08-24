const express = require('express');
const Task = require('../models/Task');
const Feedback = require('../models/Feedback');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all tasks
router.get('/', auth, async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('assignee', 'username avatar')
      .populate('createdBy', 'username avatar')
      .sort({ createdAt: -1 });
    
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching tasks' });
  }
});

// Create new task
router.post('/', auth, async (req, res) => {
  try {
    const taskData = {
      ...req.body,
      createdBy: req.user._id
    };
    
    const task = new Task(taskData);
    await task.save();
    
    // Emit socket event
    req.app.get('io').emit('task-created', task);
    
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Error creating task' });
  }
});

// Update task
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const task = await Task.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('assignee', 'username avatar');
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Emit socket event
    req.app.get('io').emit('task-updated', task);
    
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Error updating task' });
  }
});

// Get task with feedback
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const task = await Task.findById(id)
      .populate('assignee', 'username avatar')
      .populate('createdBy', 'username avatar');
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const feedback = await Feedback.find({ taskId: id })
      .populate('userId', 'username avatar')
      .sort({ createdAt: -1 });
    
    res.json({ task, feedback });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching task' });
  }
});

// Add feedback to task
router.post('/:taskId/feedback', auth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content, type, metadata } = req.body;
    
    const feedback = new Feedback({
      taskId,
      userId: req.user._id,
      content,
      type,
      metadata
    });
    
    await feedback.save();
    
    const populatedFeedback = await feedback.populate('userId', 'username avatar');
    
    // Emit socket event
    req.app.get('io').emit('feedback-added', {
      taskId,
      feedback: populatedFeedback
    });
    
    res.status(201).json(populatedFeedback);
  } catch (error) {
    res.status(500).json({ error: 'Error adding feedback' });
  }
});

module.exports = router;
const express = require('express');
const { Octokit } = require('octokit');
const Task = require('../models/Task');
const auth = require('../middleware/auth');
const router = express.Router();

// Import GitHub issues
router.post('/import', auth, async (req, res) => {
  try {
    const { repository, owner } = req.body;
    
    if (!req.user.githubToken) {
      return res.status(400).json({ error: 'GitHub token not configured' });
    }
    
    const octokit = new Octokit({
      auth: req.user.githubToken
    });
    
    // Get open issues
    const { data: issues } = await octokit.rest.issues.listForRepo({
      owner,
      repo: repository,
      state: 'open'
    });
    
    const importedTasks = [];
    
    for (const issue of issues) {
      // Check if task already exists
      const existingTask = await Task.findOne({ githubIssueId: issue.id.toString() });
      
      if (!existingTask) {
        const task = new Task({
          title: issue.title,
          description: issue.body || '',
          status: 'todo',
          priority: 'medium',
          createdBy: req.user._id,
          githubIssueId: issue.id.toString(),
          githubRepo: `${owner}/${repository}`,
          tags: issue.labels.map(label => label.name)
        });
        
        await task.save();
        importedTasks.push(task);
      }
    }
    
    res.json({
      message: `Imported ${importedTasks.length} new tasks`,
      tasks: importedTasks
    });
  } catch (error) {
    console.error('GitHub import error:', error);
    res.status(500).json({ error: 'Error importing GitHub issues' });
  }
});

// GitHub webhook handler
router.post('/webhook', async (req, res) => {
  try {
    const { action, issue, repository } = req.body;
    
    if (action === 'closed' && issue) {
      // Update linked task when issue is closed
      const task = await Task.findOne({ githubIssueId: issue.id.toString() });
      
      if (task) {
        task.status = 'done';
        await task.save();
        
        // Emit socket event
        req.app.get('io').emit('task-updated', task);
      }
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('GitHub webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Get user's GitHub repositories
router.get('/repositories', auth, async (req, res) => {
  try {
    if (!req.user.githubToken) {
      return res.status(400).json({ error: 'GitHub token not configured' });
    }
    
    const octokit = new Octokit({
      auth: req.user.githubToken
    });
    
    const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100
    });
    
    res.json(repos);
  } catch (error) {
    console.error('GitHub repos error:', error);
    res.status(500).json({ error: 'Error fetching repositories' });
  }
});

module.exports = router;
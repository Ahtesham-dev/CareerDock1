const express = require('express');
const SavedJob = require('../models/SavedJob');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const saved = await SavedJob.find({ userId: req.userId }).sort({ savedAt: -1 });
    res.json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { jobId, title, company, source, salary } = req.body;
    const existing = await SavedJob.findOne({ userId: req.userId, jobId });
    if (existing) return res.json(existing);
    const saved = await SavedJob.create({ userId: req.userId, jobId, title, company, source, salary });
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id/move', authMiddleware, async (req, res) => {
  try {
    const { column } = req.body;
    const saved = await SavedJob.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { column },
      { new: true }
    );
    if (!saved) return res.status(404).json({ message: 'Saved job not found' });
    res.json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const saved = await SavedJob.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!saved) return res.status(404).json({ message: 'Saved job not found' });
    res.json({ message: 'Saved job removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

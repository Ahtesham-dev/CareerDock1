const express = require('express');
const Application = require('../models/Application');
const Job = require('../models/Job');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const apps = await Application.find({ userId: req.userId }).sort({ appliedDate: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { company, role, status, source, notes, jobId } = req.body;
    const app = await Application.create({
      userId: req.userId, company, role, status, source, notes, jobId
    });
    res.status(201).json(app);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/auto-apply', authMiddleware, async (req, res) => {
  try {
    const { jobId } = req.body;
    if (!jobId) return res.status(400).json({ message: 'jobId required' });
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    const existing = await Application.findOne({ userId: req.userId, jobId });
    if (existing) return res.status(409).json({ message: 'Already applied' });
    const app = await Application.create({
      userId: req.userId,
      company: job.company,
      role: job.title,
      status: 'Applied',
      source: job.source,
      jobId: job._id
    });
    await Job.findByIdAndUpdate(jobId, { $inc: { applied: 1 } });
    res.status(201).json(app);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const app = await Application.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    if (!app) return res.status(404).json({ message: 'Application not found' });
    res.json(app);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const app = await Application.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!app) return res.status(404).json({ message: 'Application not found' });
    res.json({ message: 'Application removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

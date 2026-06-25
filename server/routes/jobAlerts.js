const express = require('express');
const JobAlert = require('../models/JobAlert');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const alerts = await JobAlert.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { keywords, location, minSalary, employmentType } = req.body;
    if (!keywords) return res.status(400).json({ message: 'Keywords required' });
    const alert = await JobAlert.create({
      userId: req.userId, keywords, location, minSalary: minSalary || 0, employmentType
    });
    res.status(201).json(alert);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const alert = await JobAlert.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    res.json(alert);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id/toggle', authMiddleware, async (req, res) => {
  try {
    const alert = await JobAlert.findOne({ _id: req.params.id, userId: req.userId });
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    alert.isActive = !alert.isActive;
    await alert.save();
    res.json(alert);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/test', authMiddleware, async (req, res) => {
  try {
    const alert = await JobAlert.findOne({ _id: req.params.id, userId: req.userId });
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    const { checkAlerts } = require('../services/jobAlertCron');
    await checkAlerts();
    res.json({ message: 'Alert check triggered' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const alert = await JobAlert.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    res.json({ message: 'Alert deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

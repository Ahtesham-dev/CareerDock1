const express = require('express');
const JobFeedback = require('../models/JobFeedback');
const Job = require('../models/Job');
const UserProfile = require('../models/UserProfile');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { jobId, vote, reason } = req.body;
    if (!['up', 'down'].includes(vote)) return res.status(400).json({ message: 'Vote must be up or down' });
    const feedback = await JobFeedback.findOneAndUpdate(
      { userId: req.userId, jobId },
      { vote, reason },
      { upsert: true, new: true }
    );
    res.status(201).json(feedback);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const feedbacks = await JobFeedback.find({ userId: req.userId })
      .populate('jobId', 'title company');
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const total = await JobFeedback.countDocuments({ userId: req.userId });
    const up = await JobFeedback.countDocuments({ userId: req.userId, vote: 'up' });
    const down = await JobFeedback.countDocuments({ userId: req.userId, vote: 'down' });
    const downReasons = await JobFeedback.aggregate([
      { $match: { userId: req.userId?._id || req.userId, vote: 'down', reason: { $ne: '' } } },
      { $group: { _id: '$reason', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    const topLiked = await JobFeedback.aggregate([
      { $match: { userId: req.userId?._id || req.userId, vote: 'up' } },
      { $lookup: { from: 'jobs', localField: 'jobId', foreignField: '_id', as: 'job' } },
      { $unwind: '$job' },
      { $project: { title: '$job.title', company: '$job.company' } },
      { $limit: 10 }
    ]);
    res.json({ total, up, down, ratio: total > 0 ? up / total : 0, downReasons, topLiked });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/recommendations', authMiddleware, async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ userId: req.userId });
    const feedbacks = await JobFeedback.find({ userId: req.userId });
    const dislikedIds = feedbacks.filter(f => f.vote === 'down').map(f => f.jobId.toString());
    const filter = {};
    if (profile?.skills?.length) filter.skills = { $in: profile.skills };
    const jobs = await Job.find(filter).limit(50);
    const scored = jobs.map(job => {
      let score = 0;
      if (profile?.skills) {
        profile.skills.forEach(s => {
          if (job.skills?.some(js => js.toLowerCase().includes(s.toLowerCase()))) score += 10;
        });
      }
      if (profile?.preferredLocations) {
        profile.preferredLocations.forEach(loc => {
          if (job.location?.toLowerCase().includes(loc.toLowerCase())) score += 5;
        });
      }
      if (profile?.preferredSalary > 0 && job.salaryMax >= profile.preferredSalary * 100000) score += 3;
      if (dislikedIds.includes(job._id.toString())) score -= 10;
      return { ...job.toObject(), score };
    }).sort((a, b) => b.score - a.score);
    res.json({ recommendations: scored.slice(0, 20), scores: scored.slice(0, 20).map(j => j.score) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

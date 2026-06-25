const express = require('express');
const UserProfile = require('../models/UserProfile');
const Job = require('../models/Job');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    let profile = await UserProfile.findOne({ userId: req.userId });
    if (!profile) {
      profile = await UserProfile.create({ userId: req.userId });
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/', authMiddleware, async (req, res) => {
  try {
    const profile = await UserProfile.findOneAndUpdate(
      { userId: req.userId },
      req.body,
      { upsert: true, new: true }
    );
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/jobs', authMiddleware, async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ userId: req.userId });
    if (!profile || (!profile.skills.length && !profile.preferredLocations.length)) {
      return res.json([]);
    }
    const filter = {};
    if (profile.skills.length) {
      filter.skills = { $in: profile.skills };
    }
    if (profile.remoteOnly) {
      filter.type = 'Remote';
    } else if (profile.preferredJobTypes.length) {
      filter.type = { $in: profile.preferredJobTypes };
    }
    const jobs = await Job.find(filter).limit(50);
    const scored = jobs.map(job => {
      let score = 0;
      profile.skills.forEach(s => {
        if (job.skills?.some(js => js.toLowerCase().includes(s.toLowerCase()))) score += 10;
      });
      profile.preferredLocations.forEach(loc => {
        if (job.location?.toLowerCase().includes(loc.toLowerCase())) score += 5;
      });
      if (profile.preferredSalary > 0 && job.salaryMax >= profile.preferredSalary * 100000) score += 3;
      return { ...job.toObject(), score };
    }).sort((a, b) => b.score - a.score);
    res.json(scored);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

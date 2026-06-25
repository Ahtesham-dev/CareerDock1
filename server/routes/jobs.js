const express = require('express');
const Job = require('../models/Job');

const router = express.Router();

router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    if (!q) return res.json({ jobs: [], total: 0, page: 1, pages: 0 });
    const skip = (parseInt(page) - 1) * parseInt(limit);
    let jobs, total;
    try {
      const result = await Job.aggregate([
        { $match: { $text: { $search: q } } },
        { $addFields: { score: { $meta: 'textScore' } } },
        { $sort: { score: -1 } },
        { $skip: skip },
        { $limit: parseInt(limit) }
      ]);
      total = await Job.countDocuments({ $text: { $search: q } });
      jobs = result;
    } catch {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const filter = {
        $or: [
          { title: regex }, { company: regex },
          { description: regex }, { skills: regex },
          { location: regex }
        ]
      };
      jobs = await Job.find(filter).sort({ postedAt: -1 }).skip(skip).limit(parseInt(limit));
      total = await Job.countDocuments(filter);
    }
    res.json({ jobs, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, q, skills, type, exp, sort, sources } = req.query;
    const filter = {};
    if (q) {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ title: regex }, { company: regex }, { description: regex }];
    }
    if (skills) filter.skills = { $in: skills.split(',').map(s => new RegExp(s.trim(), 'i')) };
    if (type) filter.type = type;
    if (exp) filter.experience = exp;
    if (sources) filter.source = { $in: sources.split(',').map(s => s.trim()) };
    let sortOption = { postedAt: -1 };
    if (sort === 'salary') sortOption = { salaryMax: -1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);
    let jobs = await Job.find(filter).sort(sortOption).skip(skip).limit(parseInt(limit));
    const total = await Job.countDocuments(filter);
    if (sort === 'match' && q) {
      const query = q.toLowerCase();
      jobs = jobs.map(j => {
        let score = 0;
        if (j.title?.toLowerCase().includes(query)) score += 5;
        if (j.company?.toLowerCase().includes(query)) score += 3;
        if (j.skills?.some(s => s.toLowerCase().includes(query))) score += 2;
        return { ...j.toObject(), score };
      }).sort((a, b) => b.score - a.score);
    }
    res.json({ jobs, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/sources/counts', async (req, res) => {
  try {
    const sources = await Job.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const total = sources.reduce((acc, s) => acc + s.count, 0);
    res.json({ sources, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const job = await Job.create(req.body);
    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

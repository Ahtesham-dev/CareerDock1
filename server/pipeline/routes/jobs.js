const express = require('express');
const router = express.Router();
const { PipelineJob } = require('../models');

router.get('/', async (req, res) => {
  try {
    const {
      page = 1, limit = 20, q, skills, source, location, remote,
      exp, salaryMin, salaryMax, active = 'true', sort
    } = req.query;

    const filter = {};
    if (active === 'true') filter.active = true;

    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { company: { $regex: escaped, $options: 'i' } },
        { description: { $regex: escaped, $options: 'i' } },
        { skills: { $regex: escaped, $options: 'i' } },
        { tags: { $regex: escaped, $options: 'i' } }
      ];
    }

    if (skills) {
      const skillsArr = skills.split(',').map(s => s.trim());
      filter.skills = { $in: skillsArr.map(s => new RegExp(s, 'i')) };
    }

    if (source) {
      filter.source = { $in: source.split(',').map(s => s.trim()) };
    }

    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    if (remote === 'true') filter.remote = true;
    if (exp) filter.experience = exp;
    if (salaryMin) filter.salaryMin = { $gte: Number(salaryMin) };
    if (salaryMax) filter.salaryMax = { $lte: Number(salaryMax) };

    let sortOption = { postedAt: -1 };
    if (sort === 'salary') sortOption = { salaryMax: -1 };
    if (sort === 'quality') sortOption = { qualityScore: -1 };
    if (sort === 'title') sortOption = { title: 1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [jobs, total] = await Promise.all([
      PipelineJob.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      PipelineJob.countDocuments(filter)
    ]);

    res.json({
      jobs,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    if (!q) return res.json({ jobs: [], total: 0, page: 1, pages: 0 });

    const skip = (parseInt(page) - 1) * parseInt(limit);
    let jobs, total;

    try {
      const result = await PipelineJob.aggregate([
        { $match: { $text: { $search: q }, active: true } },
        { $addFields: { score: { $meta: 'textScore' } } },
        { $sort: { score: -1 } },
        { $skip: skip },
        { $limit: parseInt(limit) }
      ]);
      total = await PipelineJob.countDocuments({ $text: { $search: q }, active: true });
      jobs = result;
    } catch {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      const filter = {
        active: true,
        $or: [
          { title: regex }, { company: regex },
          { description: regex }, { skills: regex },
          { location: regex }, { tags: regex }
        ]
      };
      jobs = await PipelineJob.find(filter)
        .sort({ postedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();
      total = await PipelineJob.countDocuments(filter);
    }

    res.json({ jobs, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/company/:company', async (req, res) => {
  try {
    const { company } = req.params;
    const { page = 1, limit = 20, active = 'true' } = req.query;

    const filter = {
      company: { $regex: new RegExp(`^${company.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    };
    if (active === 'true') filter.active = true;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [jobs, total] = await Promise.all([
      PipelineJob.find(filter).sort({ postedAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      PipelineJob.countDocuments(filter)
    ]);

    res.json({ jobs, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/source/:source', async (req, res) => {
  try {
    const { source } = req.params;
    const { page = 1, limit = 20, active = 'true' } = req.query;

    const filter = { source };
    if (active === 'true') filter.active = true;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [jobs, total] = await Promise.all([
      PipelineJob.find(filter).sort({ postedAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      PipelineJob.countDocuments(filter)
    ]);

    res.json({ jobs, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const job = await PipelineJob.findById(req.params.id).lean();
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/sources/counts', async (req, res) => {
  try {
    const sources = await PipelineJob.aggregate([
      { $match: { active: true } },
      { $group: { _id: '$source', count: { $sum: 1 }, avgQuality: { $avg: '$qualityScore' } } },
      { $sort: { count: -1 } }
    ]);
    const total = sources.reduce((a, s) => a + s.count, 0);
    res.json({ sources, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

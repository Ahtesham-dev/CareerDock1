const express = require('express');
const router = express.Router();
const ATSMatcher = require('../engine/atsMatcher');
const Job = require('../models/Job');
const { authMiddleware } = require('../middleware/auth');

router.post('/match', authMiddleware, async (req, res) => {
  try {
    const { resumeText, jobId } = req.body;
    if (!resumeText || !jobId) {
      return res.status(400).json({ error: 'resumeText and jobId are required' });
    }

    const job = await Job.findById(jobId).lean();
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const result = await ATSMatcher.match(resumeText, job);
    res.json(result);
  } catch (err) {
    console.error('[ATS] Match error:', err.message);
    res.status(500).json({ error: 'ATS match failed' });
  }
});

router.post('/batch-match', authMiddleware, async (req, res) => {
  try {
    const { resumeText, jobIds } = req.body;
    if (!resumeText || !jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
      return res.status(400).json({ error: 'resumeText and jobIds[] are required' });
    }
    if (jobIds.length > 20) {
      return res.status(400).json({ error: 'Maximum 20 jobs per batch' });
    }

    const jobs = await Job.find({ _id: { $in: jobIds } }).lean();
    const results = await Promise.all(
      jobs.map(job => ATSMatcher.match(resumeText, job).then(r => ({ jobId: job._id, ...r })))
    );
    res.json({ results });
  } catch (err) {
    console.error('[ATS] Batch match error:', err.message);
    res.status(500).json({ error: 'Batch ATS match failed' });
  }
});

router.post('/extract-skills', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });
    const skills = ATSMatcher.extractSkills(text);
    res.json({ skills, count: skills.length });
  } catch (err) {
    res.status(500).json({ error: 'Skill extraction failed' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const admin = require('../middleware/admin');
const DedupEngine = require('../engine/deduplication');
const QualityEngine = require('../engine/qualityScore');
const RankingEngine = require('../engine/ranking');
const RecommendationEngine = require('../engine/recommendation');
const Job = require('../models/Job');
const UserProfile = require('../models/UserProfile');
const Recommendation = require('../models/Recommendation');
const { runDedupWorker } = require('../workers/dedupWorker');
const { runQualityWorker } = require('../workers/qualityWorker');

router.post('/dedup/run', authMiddleware, admin, async (req, res) => {
  try {
    const result = await runDedupWorker({ lookbackDays: req.body.lookbackDays || 7, useEmbeddings: req.body.useEmbeddings || false });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/dedup/stats', authMiddleware, async (req, res) => {
  try {
    const total = await Job.countDocuments();
    const grouped = await Job.countDocuments({ dupGroup: { $ne: null } });
    const flagged = await Job.countDocuments({ dupFlagged: true });
    const groups = await Job.distinct('dupGroup', { dupGroup: { $ne: null } });
    res.json({ total, grouped, flagged, uniqueGroups: groups.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/quality/run', authMiddleware, admin, async (req, res) => {
  try {
    const result = await runQualityWorker({ refresh: req.body.refresh || false });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/quality/:jobId', authMiddleware, async (req, res) => {
  try {
    const result = await QualityEngine.scoreJobById(req.params.jobId);
    if (!result) return res.status(404).json({ error: 'Job not found' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/rank', authMiddleware, async (req, res) => {
  try {
    const { jobIds, sort } = req.query;
    if (!jobIds) return res.status(400).json({ error: 'jobIds required (comma-separated)' });
    const ids = jobIds.split(',').filter(Boolean);
    const jobs = await Job.find({ _id: { $in: ids } }).lean();
    const profile = await UserProfile.findOne({ userId: req.userId }).lean();
    const ranked = RankingEngine.computeRanking(jobs, profile);
    res.json({ ranked, total: ranked.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/recommendations', authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const raw = req.query.raw === 'true';

    if (raw) {
      const results = await RecommendationEngine.getRecommendations(req.userId, { limit });
      return res.json({ recommendations: results, generated: 'live' });
    }

    let cached = await Recommendation.find({ userId: req.userId, type: 'job' })
      .sort({ 'items.score': -1 })
      .limit(1)
      .lean();
    if (cached.length > 0 && Date.now() - new Date(cached[0].generatedAt).getTime() < 3600000) {
      return res.json({ recommendations: cached[0].items.slice(0, limit), generated: 'cached' });
    }

    const results = await RecommendationEngine.getRecommendations(req.userId, { limit });
    res.json({ recommendations: results, generated: 'live' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/recommendations/skills', authMiddleware, async (req, res) => {
  try {
    const results = await RecommendationEngine.getSkillRecommendations(req.userId);
    res.json({ recommendations: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/recommendations/companies', authMiddleware, async (req, res) => {
  try {
    const results = await RecommendationEngine.getCompanyRecommendations(req.userId);
    res.json({ recommendations: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/recommendations/career-paths', authMiddleware, async (req, res) => {
  try {
    const results = await RecommendationEngine.getCareerPathRecommendations(req.userId);
    res.json({ recommendations: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

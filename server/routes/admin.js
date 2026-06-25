const express = require('express');
const Job = require('../models/Job');
const ScraperRun = require('../models/ScraperRun');
const SourceHealth = require('../models/SourceHealth');
const { authMiddleware } = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const { runAllScrapers, runScraper } = require('../scrapers/aggregator');
const urlValidation = require('../services/urlValidation');

const router = express.Router();

router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const totalJobs = await Job.countDocuments();
    const activeJobs = await Job.countDocuments({ active: true });
    const bySource = await Job.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 }, active: { $sum: { $cond: ['$active', 1, 0] } } } },
      { $sort: { count: -1 } }
    ]);
    const last24h = await Job.countDocuments({
      postedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    const recentRuns = await ScraperRun.find().sort({ startedAt: -1 }).limit(5);
    res.json({ totalJobs, activeJobs, bySource, last24h, recentRuns });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/runs', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const runs = await ScraperRun.find().sort({ startedAt: -1 }).limit(50);
    res.json(runs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/runs/:source', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const runs = await ScraperRun.find({ source: req.params.source }).sort({ startedAt: -1 }).limit(20);
    res.json(runs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/source-health', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const health = await SourceHealth.find().sort({ source: 1 }).lean();
    res.json(health);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/source-health/:source', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const health = await SourceHealth.findOne({ source: req.params.source }).lean();
    if (!health) return res.status(404).json({ message: 'Source not found' });
    res.json(health);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/url-validation-stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const stats = await Job.aggregate([
      { $group: { _id: '$applyUrlStatus', count: { $sum: 1 } } }
    ]);
    const total = stats.reduce((s, g) => s + g.count, 0);
    res.json({ stats, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/dedup-stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const grouped = await Job.countDocuments({ dupGroup: { $ne: null } });
    const total = await Job.countDocuments();
    res.json({ grouped, total, duplicateRate: total > 0 ? Math.round((grouped / total) * 100) : 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/cleanup', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const CleanupService = require('../services/cleanupService');
    const result = await CleanupService.runDailyCleanup();
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/validate-urls', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { limit = 100 } = req.body;
    const jobs = await Job.find({
      applyUrl: { $ne: '', $exists: true },
      $or: [
        { applyUrlStatus: { $ne: 'valid' } },
        { applyUrlStatus: { $exists: false } },
        { lastValidatedAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
      ]
    }).limit(limit).lean();
    const results = await urlValidation.validateBatch(jobs);
    let updated = 0;
    for (const { job, result } of results) {
      await Job.findByIdAndUpdate(job._id, {
        $set: {
          applyUrlStatus: result.status,
          lastValidatedAt: new Date(),
          ...(result.statusCode ? { 'metadata.urlStatusCode': result.statusCode } : {})
        }
      });
      updated++;
    }
    res.json({ checked: results.length, updated, stats: urlValidation.getStats() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/scrape', authMiddleware, adminMiddleware, async (req, res) => {
  res.json({ message: 'Scraping started' });
  try {
    const result = await runAllScrapers();
    console.log('[Admin] Scrape completed:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('[Admin] Scrape failed:', err.message);
  }
});

router.post('/scrape/:source', authMiddleware, adminMiddleware, async (req, res) => {
  res.json({ message: `Scraping ${req.params.source} started` });
  try {
    const result = await runScraper(req.params.source);
    console.log(`[Admin] Scrape ${req.params.source} completed:`, JSON.stringify(result));
  } catch (err) {
    console.error(`[Admin] Scrape ${req.params.source} failed:`, err.message);
  }
});

module.exports = router;

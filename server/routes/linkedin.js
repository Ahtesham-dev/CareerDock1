const express = require('express');
const ScraperRun = require('../models/ScraperRun');
const { authMiddleware } = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();

router.get('/status', authMiddleware, async (req, res) => {
  try {
    const lastRun = await ScraperRun.findOne({ source: 'LinkedIn' }).sort({ startedAt: -1 });
    res.json({ lastRun: lastRun?.startedAt || null, isRunning: lastRun?.status === 'running' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/sync', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const lastRun = await ScraperRun.findOne({ source: 'LinkedIn', status: 'running' });
    if (lastRun) return res.status(429).json({ message: 'Sync already in progress' });
    const { runScraper } = require('../scrapers/aggregator');
    runScraper('LinkedIn').then(result => {
      console.log('LinkedIn sync completed:', result);
    });
    res.json({ message: 'LinkedIn sync started' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

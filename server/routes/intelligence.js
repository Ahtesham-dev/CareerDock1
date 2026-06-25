const express = require('express');
const router = express.Router();
const CareerIntelligence = require('../engine/careerIntelligence');
const auth = require('../middleware/auth');
const CacheService = require('../services/cache');

router.get('/salary', async (req, res) => {
  try {
    const cacheKey = CacheService.generateKey('intel:salary', req.query);
    const cached = await CacheService.get(cacheKey);
    if (cached) return res.json(cached);

    const result = await CareerIntelligence.salaryIntelligence(req.query);
    await CacheService.set(cacheKey, result, 3600);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Salary intelligence failed' });
  }
});

router.get('/skills', async (req, res) => {
  try {
    const cacheKey = 'intel:skills';
    const cached = await CacheService.get(cacheKey);
    if (cached) return res.json(cached);

    const result = await CareerIntelligence.skillIntelligence();
    await CacheService.set(cacheKey, result, 3600);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Skill intelligence failed' });
  }
});

router.get('/locations', async (req, res) => {
  try {
    const cacheKey = 'intel:locations';
    const cached = await CacheService.get(cacheKey);
    if (cached) return res.json(cached);

    const result = await CareerIntelligence.locationIntelligence();
    await CacheService.set(cacheKey, result, 3600);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Location intelligence failed' });
  }
});

router.get('/hiring', async (req, res) => {
  try {
    const cacheKey = 'intel:hiring';
    const cached = await CacheService.get(cacheKey);
    if (cached) return res.json(cached);

    const result = await CareerIntelligence.hiringIntelligence();
    await CacheService.set(cacheKey, result, 3600);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Hiring intelligence failed' });
  }
});

router.get('/trends', async (req, res) => {
  try {
    const cacheKey = 'intel:trends';
    const cached = await CacheService.get(cacheKey);
    if (cached) return res.json(cached);

    const result = await CareerIntelligence.trendSummary();
    await CacheService.set(cacheKey, result, 1800);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Trend summary failed' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const SearchEngine = require('../engine/searchEngine');
const RankingEngine = require('../engine/ranking');
const UserProfile = require('../models/UserProfile');
const CacheService = require('../services/cache');

router.get('/', async (req, res) => {
  try {
    const cacheKey = CacheService.generateKey('search', req.query);
    const cached = await CacheService.get(cacheKey);
    if (cached) return res.json(cached);

    const result = await SearchEngine.search(req.query);

    let profile = null;
    if (req.user) {
      profile = await UserProfile.findOne({ userId: req.user._id }).lean();
    }

    if (result.jobs.length > 0 && req.query.sort === 'relevance') {
      result.jobs = RankingEngine.computeRanking(result.jobs, profile);
    }

    await CacheService.set(cacheKey, result, 120);
    res.json(result);
  } catch (err) {
    console.error('[Search] Error:', err.message);
    res.status(500).json({ error: 'Search failed', message: err.message });
  }
});

router.get('/autocomplete', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) return res.json([]);
    const cacheKey = `autocomplete:${q.toLowerCase().trim()}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return res.json(cached);

    const results = await SearchEngine.autocomplete(q.trim());
    await CacheService.set(cacheKey, results, 60);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Autocomplete failed' });
  }
});

router.get('/correct', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ original: '', corrected: '', corrections: [] });
    const result = await SearchEngine.correctQuery(q);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Query correction failed' });
  }
});

router.get('/suggest', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) return res.json({ suggestions: [] });
    const { expandedArray } = SearchEngine.expandQuery(q);
    res.json({ original: q, expanded: expandedArray, suggestions: expandedArray.filter(s => s !== q.toLowerCase()).slice(0, 5) });
  } catch (err) {
    res.status(500).json({ error: 'Suggestion failed' });
  }
});

module.exports = router;

const express = require('express');
const ScraperRun = require('../models/ScraperRun');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { source, page = 1, limit = 20 } = req.query;
    const filter = source ? { source } : {};
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const runs = await ScraperRun.find(filter).sort({ startedAt: -1 }).skip(skip).limit(parseInt(limit));
    const total = await ScraperRun.countDocuments(filter);
    res.json({ runs, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/latest', async (req, res) => {
  try {
    const latest = await ScraperRun.aggregate([
      { $sort: { startedAt: -1 } },
      { $group: { _id: '$source', doc: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$doc' } }
    ]);
    res.json(latest);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

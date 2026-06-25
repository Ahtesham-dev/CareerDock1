const express = require('express');
const router = express.Router();
const orchestrator = require('../orchestrator');
const { healthMonitor, PipelineLogger } = require('../monitoring');
const { PipelineRun, CompanyRegistry } = require('../models');
const { storage } = require('../processors');
const { SOURCES, getAllSources } = require('../sources');
const { getStats } = require('../index');
const { authMiddleware } = require('../../middleware/auth');
const adminMiddleware = require('../../middleware/admin');

const logger = new PipelineLogger({ source: 'routes:pipeline' });

router.post('/run', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { sources, trigger } = req.body;
    const result = await orchestrator.runFullPipeline({
      sources: sources || ['ycombinator', 'peerlist'],
      trigger: trigger || 'manual'
    });
    res.json({ success: true, ...result });
  } catch (err) {
    logger.error(`Manual pipeline run failed: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/run/:source', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { source } = req.params;
    const result = await orchestrator.runSource(source, {
      trigger: req.body.trigger || 'manual',
      refreshRegistry: req.body.refreshRegistry !== false
    });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/refresh-companies', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await orchestrator.refreshCompanyRegistry();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const stats = await getStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/sources/health', async (req, res) => {
  try {
    const health = healthMonitor.getAllHealth();
    res.json(health);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/sources', async (req, res) => {
  try {
    res.json({ sources: getAllSources() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/runs', async (req, res) => {
  try {
    const { limit = 50, source, status } = req.query;
    const filter = {};
    if (source) filter.source = source;
    if (status) filter.status = status;

    const runs = await PipelineRun.find(filter)
      .sort({ startedAt: -1 })
      .limit(parseInt(limit))
      .lean();
    res.json({ runs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/runs/:id', async (req, res) => {
  try {
    const run = await PipelineRun.findById(req.params.id).lean();
    if (!run) return res.status(404).json({ error: 'Run not found' });
    res.json(run);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/companies', async (req, res) => {
  try {
    const { batch, platform, limit = 100, page = 1 } = req.query;
    const filter = {};
    if (batch) filter.batch = batch;
    if (platform) filter.careersPlatform = platform;

    const total = await CompanyRegistry.countDocuments(filter);
    const companies = await CompanyRegistry.find(filter)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    res.json({ companies, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/companies/:id', async (req, res) => {
  try {
    const company = await CompanyRegistry.findById(req.params.id).lean();
    if (!company) return res.status(404).json({ error: 'Company not found' });
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/expired', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const expired = await storage.markExpired('all', days);
    const archived = await storage.archiveOldJobs(60);
    res.json({ success: true, markedExpired: expired, archived });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

const orchestrator = require('./orchestrator');
const scheduler = require('./scheduler');
const { healthMonitor, PipelineLogger } = require('./monitoring');
const { storage } = require('./processors');
const { getSource, getAllSources, SOURCES } = require('./sources');

async function getStats() {
  const allHealth = healthMonitor.getAllHealth();
  const dbStats = await healthMonitor.getDbStats();
  const activeJobs = await storage.getActiveJobCount();

  const sourceStats = {};
  for (const [key, adapter] of Object.entries(SOURCES)) {
    sourceStats[key] = await storage.getSourceStats(key);
  }

  return {
    health: allHealth,
    database: dbStats,
    activeJobs,
    sourceStats,
    uptime: process.uptime()
  };
}

module.exports = {
  orchestrator,
  scheduler,
  healthMonitor,
  PipelineLogger,
  getStats,
  getSource,
  getAllSources,
  SOURCES
};

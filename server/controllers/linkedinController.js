const ScraperRun = require('../models/ScraperRun');

const getStatus = async () => {
  const lastRun = await ScraperRun.findOne({ source: 'LinkedIn' }).sort({ startedAt: -1 });
  return { lastRun: lastRun?.startedAt || null, isRunning: lastRun?.status === 'running' };
};

module.exports = { getStatus };

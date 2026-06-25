const cron = require('node-cron');
const { runAllScrapers, runScraper } = require('./scrapers/aggregator');
const { checkAlerts } = require('./services/jobAlertCron');
const cleanupService = require('./services/cleanupService');

let isRunning = false;

const startScheduler = () => {
  setTimeout(async () => {
    if (!isRunning) {
      isRunning = true;
      console.log('Starting initial scraper run...');
      try {
        const result = await runAllScrapers();
        console.log('Initial scrape complete:', result.total, 'jobs saved');
      } catch (err) {
        console.error('Initial scrape failed:', err.message);
      }
      isRunning = false;
    }
  }, 10000);

  cron.schedule('0 * * * *', async () => {
    if (isRunning) return;
    isRunning = true;
    console.log('Starting hourly scrape...');
    try {
      const result = await runAllScrapers();
      console.log('Hourly scrape complete:', result.total, 'jobs saved,', result.errors.length, 'errors');
    } catch (err) {
      console.error('Hourly scrape failed:', err.message);
    }
    isRunning = false;
  });

  // Separate high-frequency scrapers
  cron.schedule('*/30 * * * *', async () => {
    if (isRunning) return;
    try {
      await runScraper('JSearch');
    } catch (err) {
      console.error('JSearch extra scrape failed:', err.message);
    }
  });

  cron.schedule('*/30 * * * *', async () => {
    try {
      await checkAlerts();
    } catch (err) {
      console.error('Alert check failed:', err.message);
    }
  });

  // Daily maintenance at 2am
  cron.schedule('0 2 * * *', async () => {
    console.log('Starting daily maintenance...');
    try {
      const result = await cleanupService.runDailyCleanup();
      console.log('Daily maintenance complete:', JSON.stringify(result));
    } catch (err) {
      console.error('Daily maintenance failed:', err.message);
    }
  });

  // Source health recalculation every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    try {
      const updated = await cleanupService.recalculateSourceHealth();
      console.log('Source health recalculated for', updated, 'sources');
    } catch (err) {
      console.error('Source health recalculation failed:', err.message);
    }
  });

  console.log('Scheduler started');
};

module.exports = { startScheduler };

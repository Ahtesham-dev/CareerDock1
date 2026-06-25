const cron = require('node-cron');
const pipelineScheduler = require('../../../pipeline/scheduler');
const { runAllScrapers } = require('../../../scrapers/aggregator');

class SchedulerService {
  constructor() {
    this.jobs = [];
  }

  startLegacy(schedule = '0 * * * *') {
    this.jobs.push(cron.schedule(schedule, async () => {
      console.log('[Scheduler] Legacy scraper run started');
      try {
        const result = await runAllScrapers();
        console.log(`[Scheduler] Legacy run complete: ${result.total} jobs`);
      } catch (err) {
        console.error('[Scheduler] Legacy run failed:', err.message);
      }
    }));
  }

  startPipeline() {
    pipelineScheduler.start();
  }

  stopAll() {
    for (const job of this.jobs) job.stop();
    pipelineScheduler.stop();
  }
}

module.exports = new SchedulerService();

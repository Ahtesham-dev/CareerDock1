const cron = require('node-cron');
const orchestrator = require('../orchestrator');
const { PipelineLogger, healthMonitor } = require('../monitoring');

class PipelineScheduler {
  constructor() {
    this.logger = new PipelineLogger({ source: 'scheduler' });
    this.isRunning = false;
    this.scheduledJobs = [];
  }

  start() {
    this.logger.info('Starting pipeline scheduler');

    this.scheduledJobs.push(
      cron.schedule('0 */2 * * *', () => this._runWithLock('Full pipeline (every 2h)', () =>
        orchestrator.runFullPipeline({ trigger: 'scheduled', sources: ['ycombinator', 'peerlist', 'cutshort', 'instahyre', 'hirect'] })
      ))
    );

    this.scheduledJobs.push(
      cron.schedule('30 */6 * * *', () => this._runWithLock('YC registry refresh (2x/day)', () =>
        orchestrator.runSource('ycombinator', { trigger: 'scheduled', refreshRegistry: true })
      ))
    );

    this.scheduledJobs.push(
      cron.schedule('0 */4 * * *', () => this._runWithLock('Peerlist refresh (4x/day)', () =>
        orchestrator.runSource('peerlist', { trigger: 'scheduled', refreshRegistry: false })
      ))
    );

    this.scheduledJobs.push(
      cron.schedule('0 */6 * * *', () => this._runWithLock('Cutshort refresh (4x/day)', () =>
        orchestrator.runSource('cutshort', { trigger: 'scheduled' })
      ))
    );

    this.scheduledJobs.push(
      cron.schedule('0 */6 * * *', () => this._runWithLock('Instahyre refresh (4x/day)', () =>
        orchestrator.runSource('instahyre', { trigger: 'scheduled' })
      ))
    );

    this.scheduledJobs.push(
      cron.schedule('0 */6 * * *', () => this._runWithLock('Hirect refresh (4x/day)', () =>
        orchestrator.runSource('hirect', { trigger: 'scheduled' })
      ))
    );

    this.scheduledJobs.push(
      cron.schedule('0 3 * * *', () => this._runWithLock('Daily maintenance', async () => {
        const { storage } = require('../processors');
        const expired = await storage.markExpired('all', 7);
        const archived = await storage.archiveOldJobs(60);
        this.logger.info(`Maintenance: ${expired} expired, ${archived} archived`);
      }))
    );

    setTimeout(() => this._runWithLock('Initial pipeline start', () =>
      orchestrator.runFullPipeline({ trigger: 'startup', sources: ['ycombinator', 'peerlist', 'cutshort', 'instahyre', 'hirect'] })
    ), 15000);

    this.logger.info('Pipeline scheduler started successfully');
  }

  async _runWithLock(name, fn) {
    if (this.isRunning) {
      this.logger.warn(`Skipping "${name}" — pipeline already running`);
      return;
    }
    this.isRunning = true;
    this.logger.info(`Starting: ${name}`);
    try {
      const result = await fn();
      this.logger.info(`Completed: ${name}`, result);
    } catch (err) {
      this.logger.error(`Failed: ${name} — ${err.message}`);
    } finally {
      this.isRunning = false;
    }
  }

  stop() {
    for (const job of this.scheduledJobs) job.stop();
    this.logger.info('Scheduler stopped');
  }

  status() {
    return {
      running: this.isRunning,
      scheduledJobs: this.scheduledJobs.length,
      health: healthMonitor.getAllHealth()
    };
  }
}

module.exports = new PipelineScheduler();

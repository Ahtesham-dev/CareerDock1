const { PipelineRun } = require('./models');
const { SOURCES } = require('./sources');
const { normalizer, deduplicator, validator, storage } = require('./processors');
const { healthMonitor, PipelineLogger } = require('./monitoring');
const JobQueue = require('./queue');

class PipelineOrchestrator {
  constructor() {
    this.logger = new PipelineLogger({ source: 'orchestrator' });
    this.queue = new JobQueue({ concurrency: 3, retryMax: 2, baseDelay: 2000 });
    this._setupQueueHandlers();
  }

  _setupQueueHandlers() {
    this.queue.on('completed', ({ task, result }) => {
      this.logger.info(`Queue completed: ${task.source || 'unknown'}`);
      healthMonitor.recordRun(task.source || 'unknown', result);
    });
    this.queue.on('failed', ({ task, error }) => {
      this.logger.error(`Queue failed: ${task.source || 'unknown'} — ${error}`);
      healthMonitor.recordRun(task.source || 'unknown', { success: false, error, duration: 0 });
    });
    this.queue.on('retry', ({ task, attempt, delay }) => {
      this.logger.warn(`Retrying ${task.source} (attempt ${attempt}) in ${delay}ms`);
    });
  }

  async runFullPipeline(options = {}) {
    const {
      sources = ['ycombinator', 'peerlist', 'cutshort', 'instahyre', 'hirect'],
      refreshRegistry = true,
      dedup = true,
      validate = true,
      markExpired = true,
      archive = false,
      trigger = 'scheduled'
    } = options;

    this.logger.info('=== Pipeline Run Started ===');
    const pipelineRun = await PipelineRun.create({
      pipeline: 'main',
      source: 'all',
      status: 'running',
      trigger,
      startedAt: new Date()
    });

    const start = Date.now();
    const results = [];

    for (const sourceKey of sources) {
      const adapter = SOURCES[sourceKey];
      if (!adapter) {
        this.logger.warn(`Unknown source: ${sourceKey}, skipping`);
        continue;
      }

      await this.queue.enqueue({
        data: { sourceKey, adapter, refreshRegistry },
        handler: async (data) => {
          const { sourceKey: sk, adapter: ad, refreshRegistry: rr } = data;
          this.logger.info(`Running source: ${sk}`);

          let rawJobs;
          if (sk === 'ycombinator') {
            rawJobs = await ad.fetchJobs({ refreshRegistry: rr });
          } else {
            rawJobs = await ad.fetchJobs();
          }

          this.logger.info(`Source ${sk}: ${rawJobs.length} raw jobs`);

          const normalized = rawJobs.map(j => normalizer.normalize(j));
          this.logger.info(`Source ${sk}: ${normalized.length} after normalization`);

          let pipelineJobs = normalized;
          const pipelineResult = {
            found: normalized.length,
            new: 0,
            updated: 0,
            deduped: 0,
            rejected: 0
          };

          if (validate) {
            const validated = [];
            for (const job of normalized) {
              const result = validator.validate(job);
              if (result.valid) {
                validated.push(job);
              } else {
                pipelineResult.rejected++;
                this.logger.debug(`Rejected: "${job.title}" @ ${job.company} — ${result.errors.join(', ')}`);
              }
            }
            pipelineJobs = validated;
            this.logger.info(`Source ${sk}: ${pipelineResult.rejected} rejected by validation`);
          }

          if (dedup) {
            const dedupResult = await deduplicator.deduplicate(pipelineJobs);
            pipelineJobs = dedupResult.keep;
            pipelineResult.deduped = dedupResult.duplicates.length;
            this.logger.info(`Source ${sk}: ${pipelineResult.deduped} duplicates removed`);
          }

          const saveResult = await storage.saveJobs(pipelineJobs, sk);
          pipelineResult.new = saveResult.inserted;
          pipelineResult.updated = saveResult.updated;

          if (markExpired) {
            const expired = await storage.markExpired(sk);
            pipelineResult.expired = expired;
          }

          this.logger.info(`Source ${sk}: ${saveResult.inserted} new, ${saveResult.updated} updated`);
          return { success: true, found: normalized.length, saved: saveResult.inserted + saveResult.updated, duration: 0 };
        }
      });

      await new Promise(r => setTimeout(r, 100));
    }

    await this._drainQueue();
    const totalDuration = Date.now() - start;

    if (archive) {
      const archived = await storage.archiveOldJobs();
      this.logger.info(`Archived ${archived} old jobs`);
    }

    const totals = {
      jobsFound: results.reduce((a, r) => a + (r.found || 0), 0),
      jobsSaved: results.reduce((a, r) => a + (r.saved || 0), 0)
    };

    await PipelineRun.updateOne(
      { _id: pipelineRun._id },
      {
        $set: {
          status: 'success',
          completedAt: new Date(),
          duration: totalDuration,
          jobsFound: totals.jobsFound,
          jobsNew: totals.jobsSaved,
          jobsUpdated: 0,
          jobsDeduped: 0,
          jobsExpired: 0,
          jobsRejected: 0
        }
      }
    );

    this.logger.info(`=== Pipeline Run Complete (${totalDuration}ms) ===`);
    return { pipelineRunId: pipelineRun._id, duration: totalDuration, totals };
  }

  async runSource(sourceKey, options = {}) {
    const adapter = SOURCES[sourceKey];
    if (!adapter) throw new Error(`Unknown source: ${sourceKey}`);

    const pipelineRun = await PipelineRun.create({
      pipeline: 'source',
      source: sourceKey,
      status: 'running',
      trigger: options.trigger || 'manual',
      startedAt: new Date()
    });

    const start = Date.now();
    let rawJobs;

    try {
      if (sourceKey === 'ycombinator') {
        rawJobs = await adapter.fetchJobs({
          refreshRegistry: options.refreshRegistry !== false,
          maxCompanies: options.maxCompanies
        });
      } else {
        rawJobs = await adapter.fetchJobs();
      }
    } catch (err) {
      await PipelineRun.updateOne(
        { _id: pipelineRun._id },
        { $set: { status: 'failed', completedAt: new Date(), duration: Date.now() - start, errorMessages: [err.message] } }
      );
      throw err;
    }

    const normalized = rawJobs.map(j => normalizer.normalize(j));

    let pipelineJobs = normalized;
    let rejected = 0;
    if (options.validate !== false) {
      const validated = [];
      for (const job of normalized) {
        const result = validator.validate(job);
        if (result.valid) validated.push(job);
        else rejected++;
      }
      pipelineJobs = validated;
    }

    let deduped = 0;
    if (options.dedup !== false) {
      const dedupResult = await deduplicator.deduplicate(pipelineJobs);
      pipelineJobs = dedupResult.keep;
      deduped = dedupResult.duplicates.length;
    }

    const saveResult = await storage.saveJobs(pipelineJobs, sourceKey);

    if (options.markExpired !== false) {
      await storage.markExpired(sourceKey);
    }

    await PipelineRun.updateOne(
      { _id: pipelineRun._id },
      {
        $set: {
          status: 'success',
          completedAt: new Date(),
          duration: Date.now() - start,
          jobsFound: rawJobs.length,
          jobsNew: saveResult.inserted,
          jobsUpdated: saveResult.updated,
          jobsDeduped: deduped,
          jobsRejected: rejected
        }
      }
    );

    return {
      source: sourceKey,
      raw: rawJobs.length,
      normalized: normalized.length,
      rejected,
      deduped,
      inserted: saveResult.inserted,
      updated: saveResult.updated,
      duration: Date.now() - start
    };
  }

  async refreshCompanyRegistry() {
    const YCCompanyRegistry = require('./sources/ycombinator/companyRegistry');
    const registry = new YCCompanyRegistry();
    return registry.refresh();
  }

  async _drainQueue() {
    return new Promise((resolve) => {
      const check = () => {
        if (this.queue.size() === 0) return resolve();
        setTimeout(check, 500);
      };
      check();
    });
  }
}

module.exports = new PipelineOrchestrator();

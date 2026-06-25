const crypto = require('crypto');
const Job = require('../models/Job');
const ScraperRun = require('../models/ScraperRun');
const SourceHealth = require('../models/SourceHealth');
const { deduplicateJobs } = require('./dedup');
const urlValidation = require('../services/urlValidation');

const JSearchScraper = require('./jsearch');
const GitHubScraper = require('./github');
const HackerNewsScraper = require('./hackernews');
const DevToScraper = require('./devto');
const LinkedInScraper = require('./linkedin');
const InternshalaScraper = require('./internshala');
const WellfoundScraper = require('./wellfound');
const NaukriScraper = require('./naukri');
const CareerPagesScraper = require('./careerPages');

const SCRAPERS = [
  { name: 'JSearch', cls: JSearchScraper },
  { name: 'GitHub', cls: GitHubScraper },
  { name: 'HackerNews', cls: HackerNewsScraper },
  { name: 'Dev.to', cls: DevToScraper },
  { name: 'LinkedIn', cls: LinkedInScraper },
  { name: 'Internshala', cls: InternshalaScraper },
  { name: 'Wellfound', cls: WellfoundScraper },
  { name: 'Naukri', cls: NaukriScraper },
  { name: 'Career Pages', cls: CareerPagesScraper }
];

const validateJob = (job) => {
  if (!job.title || job.title.trim().length < 3) return false;
  if (!job.company || job.company.trim().length < 2) return false;
  if (!job.applyUrl && !job.externalUrl) return false;
  return true;
};

const upsertJobs = async (jobs, source) => {
  let saved = 0;
  let rejected = 0;
  const now = new Date();
  for (const job of jobs) {
    try {
      if (!validateJob(job)) { rejected++; continue; }

      const query = [];
      if (job.hash) query.push({ hash: job.hash });
      if (job.source && job.sourceJobId) query.push({ source: job.source, sourceJobId: job.sourceJobId });
      query.push({
        title: job.title,
        company: job.company,
        location: job.location,
        source
      });

      const setData = { ...job, lastSeenAt: now, updatedAt: now };
      delete setData._id;

      await Job.findOneAndUpdate(
        { $or: query.slice(0, 2) },
        { $set: setData, $setOnInsert: { createdAt: now } },
        { upsert: true, new: true }
      );
      saved++;
    } catch (err) {
      console.error(`[Aggregator] Upsert error for "${job.title}" @ ${job.company}: ${err.message}`);
    }
  }
  return { saved, rejected };
};

const recordSourceHealth = async (source, result) => {
  try {
    const entry = {
      source,
      status: result.success ? 'success' : 'failed',
      startedAt: result.startedAt || new Date(Date.now() - (result.duration || 0)),
      completedAt: new Date(),
      duration: result.duration || 0,
      jobsFound: result.found || 0,
      jobsSaved: result.saved || 0,
      jobsRejected: result.rejected || 0,
      duplicatesRemoved: result.duplicatesRemoved || 0,
      error: result.error || ''
    };
    await ScraperRun.create(entry);

    await SourceHealth.findOneAndUpdate(
      { source },
      {
        $inc: {
          totalRuns: 1,
          ...(result.success ? { successRuns: 1 } : { failedRuns: 1 }),
          totalJobsFound: result.found || 0,
          totalJobsSaved: result.saved || 0,
          totalJobsRejected: result.rejected || 0,
          totalDuplicatesRemoved: result.duplicatesRemoved || 0,
          ...(result.success ? {} : { consecutiveFailures: 1 })
        },
        $set: {
          lastRunAt: new Date(),
          status: result.success ? 'healthy' : 'warning',
          ...(result.success ? { consecutiveFailures: 0, lastSuccessAt: new Date(), lastError: '' } : { lastError: result.error || 'Unknown error' })
        }
      },
      { upsert: true }
    );
  } catch (err) {
    console.error(`[Aggregator] Failed to record health for ${source}: ${err.message}`);
  }
};

const runAllScrapers = async () => {
  const result = { total: 0, bySource: {}, errors: [], dupResult: null, elapsed: 0 };
  const start = Date.now();

  for (const { name, cls } of SCRAPERS) {
    try {
      const scraper = new cls();
      const scrapeStart = Date.now();
      const jobs = await scraper.run();
      const { saved, rejected } = await upsertJobs(jobs, name);
      const duration = Date.now() - scrapeStart;
      result.bySource[name] = { found: jobs.length, saved, rejected };
      result.total += saved;

      await recordSourceHealth(name, {
        success: true,
        found: jobs.length,
        saved,
        rejected,
        duration,
        startedAt: new Date(Date.now() - duration)
      });
    } catch (err) {
      result.errors.push({ source: name, error: err.message });
      await recordSourceHealth(name, { success: false, found: 0, saved: 0, rejected: 0, duration: 0, error: err.message, startedAt: new Date() });
    }
  }

  try {
    result.dupResult = await deduplicateJobs();
  } catch (err) {
    result.errors.push({ source: 'dedup', error: err.message });
  }

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const expired = await Job.updateMany(
      { active: true, lastSeenAt: { $lt: sevenDaysAgo } },
      { $set: { active: false } }
    );
    result.expired = expired.modifiedCount;
  } catch (err) {
    result.errors.push({ source: 'expire', error: err.message });
  }

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const cleaned = await Job.deleteMany({ active: false, updatedAt: { $lt: thirtyDaysAgo } });
    result.cleaned = cleaned.deletedCount;
  } catch (err) {
    result.errors.push({ source: 'cleanup', error: err.message });
  }

  result.elapsed = Date.now() - start;
  return result;
};

const runScraper = async (sourceName) => {
  const entry = SCRAPERS.find(s => s.name.toLowerCase() === sourceName.toLowerCase());
  if (!entry) throw new Error(`Unknown scraper: ${sourceName}`);
  const scraper = new entry.cls();
  const scrapeStart = Date.now();
  const jobs = await scraper.run();
  const { saved, rejected } = await upsertJobs(jobs, entry.name);
  const duration = Date.now() - scrapeStart;

  await recordSourceHealth(entry.name, {
    success: true,
    found: jobs.length,
    saved,
    rejected,
    duration,
    startedAt: new Date(Date.now() - duration)
  });

  return { source: entry.name, found: jobs.length, saved, rejected };
};

module.exports = { runAllScrapers, runScraper };

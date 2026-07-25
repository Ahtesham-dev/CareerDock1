const Job = require('../../models/Job');
const { runMatching } = require('./runMatching');

/**
 * Polls for jobs created after the given timestamp and runs matching.
 * Designed to be called from the node-cron scheduler.
 * @param {Date} since - only consider jobs created after this timestamp
 */
async function pollNewJobs(since) {
  const newJobs = await Job.find({ createdAt: { $gt: since } })
    .select('_id title company skills experience salaryMin salaryMax salaryLabel location type')
    .lean();

  if (!newJobs.length) return;

  await runMatching(newJobs);
}

module.exports = { pollNewJobs };

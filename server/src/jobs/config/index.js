module.exports = {
  concurrency: parseInt(process.env.PIPELINE_CONCURRENCY) || 3,
  retryMax: parseInt(process.env.PIPELINE_RETRY_MAX) || 3,
  baseDelay: parseInt(process.env.PIPELINE_BASE_DELAY) || 2000,
  schedules: {
    full: process.env.PIPELINE_SCHEDULE_FULL || '0 */2 * * *',
    yc: process.env.PIPELINE_SCHEDULE_YC || '30 */6 * * *',
    peerlist: process.env.PIPELINE_SCHEDULE_PEERLIST || '0 */4 * * *',
    maintenance: process.env.PIPELINE_SCHEDULE_MAINTENANCE || '0 3 * * *'
  },
  dedup: {
    lookbackDays: 30,
    fuzzyThreshold: 0.9
  },
  expiry: {
    markInactiveDays: 7,
    archiveDays: 60
  }
};

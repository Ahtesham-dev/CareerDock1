const QualityEngine = require('../engine/qualityScore');

async function runQualityWorker(options = {}) {
  const { batchSize = 200, refresh = false } = options;

  console.log(`[Worker:Quality] Starting quality scoring worker (refresh: ${refresh})`);

  try {
    let result;
    if (refresh) {
      result = await QualityEngine.refreshQualityScores({ batchSize });
    } else {
      result = await QualityEngine.scoreAllJobs({ batchSize });
    }
    console.log(`[Worker:Quality] Complete — ${result.scored || result.refreshed} jobs scored`);
    return result;
  } catch (err) {
    console.error(`[Worker:Quality] Error:`, err.message);
    throw err;
  }
}

if (require.main === module) {
  const refresh = process.argv.includes('--refresh');
  runQualityWorker({ refresh })
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runQualityWorker };

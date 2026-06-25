const DedupEngine = require('../engine/deduplication');

async function runDedupWorker(options = {}) {
  const {
    lookbackDays = 7,
    batchSize = 200,
    useEmbeddings = false,
    schedule = null,
  } = options;

  console.log(`[Worker:Dedup] Starting dedup worker`);

  try {
    const result = await DedupEngine.deduplicate({ lookbackDays, batchSize, useEmbeddings });
    console.log(`[Worker:Dedup] Complete — ${result.totalProcessed} processed, ${result.merged} merged, ${result.flagged} flagged`);

    if (result.flagged > 0) {
      console.log(`[Worker:Dedup] ${result.flagged} jobs flagged for manual review`);
    }
    return result;
  } catch (err) {
    console.error(`[Worker:Dedup] Error:`, err.message);
    throw err;
  }
}

if (require.main === module) {
  const lookback = parseInt(process.argv[2]) || 7;
  runDedupWorker({ lookbackDays: lookback })
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runDedupWorker };

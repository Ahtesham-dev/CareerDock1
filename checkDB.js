require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('./server/models/Job');
const ScraperRun = require('./server/models/ScraperRun');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const jobCount = await Job.countDocuments();
    const bySource = await Job.aggregate([{ $group: { _id: '$source', count: { $sum: 1 } } }, { $sort: { count: -1 } }]);
    const recentRuns = await ScraperRun.find().sort({ startedAt: -1 }).limit(5);
    console.log('=== DB Status ===');
    console.log('Total jobs:', jobCount);
    console.log('By source:', JSON.stringify(bySource, null, 2));
    console.log('Recent runs:', JSON.stringify(recentRuns, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error('DB check failed:', err.message);
    process.exit(1);
  });

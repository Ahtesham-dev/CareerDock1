require('dotenv').config();
const mongoose = require('mongoose');
const { runAllScrapers } = require('./scrapers/aggregator');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected, starting scrape...');
    const result = await runAllScrapers();
    console.log('Scrape result:', JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error('Failed:', err.message);
    process.exit(1);
  });

require('dotenv').config();
const mongoose = require('mongoose');
const JSearchScraper = require('./server/scrapers/jsearch');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Testing JSearch scraper...');
    const scraper = new JSearchScraper();
    const jobs = await scraper.run();
    console.log(`Found ${jobs.length} jobs`);
    console.log('Sample:', JSON.stringify(jobs.slice(0, 2), null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error('Test failed:', err.message);
    process.exit(1);
  });

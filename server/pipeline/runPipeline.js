require('dotenv').config();
const mongoose = require('mongoose');
const orchestrator = require('./orchestrator');

const args = process.argv.slice(2);
const sourceFlag = args.find(a => a.startsWith('--source='));
const refreshOnly = args.includes('--refresh-only');
const source = sourceFlag ? sourceFlag.split('=')[1] : null;

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');

  try {
    if (refreshOnly) {
      const result = await orchestrator.refreshCompanyRegistry();
      console.log('Company registry refreshed:', JSON.stringify(result, null, 2));
    } else if (source) {
      const result = await orchestrator.runSource(source, {
        trigger: 'manual',
        refreshRegistry: source === 'ycombinator'
      });
      console.log('Source run result:', JSON.stringify(result, null, 2));
    } else {
      const result = await orchestrator.runFullPipeline({ trigger: 'manual' });
      console.log('Pipeline result:', JSON.stringify(result, null, 2));
    }
  } catch (err) {
    console.error('Pipeline failed:', err.message);
    process.exit(1);
  }

  await mongoose.disconnect();
  process.exit(0);
}

main();

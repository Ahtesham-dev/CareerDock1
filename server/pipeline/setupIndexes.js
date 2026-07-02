require('dotenv').config();
const mongoose = require('mongoose');

async function setupPipelineIndexes() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB — setting up pipeline indexes...');

  const db = mongoose.connection.db;

  const jobs = db.collection('jobs');
  await jobs.createIndexes([
    { key: { hash: 1 }, sparse: true, name: 'idx_hash' },
    { key: { source: 1, sourceJobId: 1 }, unique: true, sparse: true, name: 'idx_source_jobid' },
    { key: { active: 1, postedAt: -1 }, name: 'idx_active_posted' },
    { key: { company: 1, active: 1 }, name: 'idx_company_active' },
    { key: { title: 1, company: 1, location: 1 }, name: 'idx_title_company_location' },
    { key: { lastSeenAt: 1 }, name: 'idx_lastSeen' },
    { key: { expiresAt: 1 }, sparse: true, name: 'idx_expires' },
    { key: { tags: 1 }, name: 'idx_tags' },
    { key: { remote: 1, active: 1 }, name: 'idx_remote_active' },
    { key: { companySlug: 1 }, name: 'idx_companySlug' },
    { key: {
      title: 'text', company: 'text', description: 'text',
      skills: 'text', location: 'text', tags: 'text'
    },
      weights: { title: 30, skills: 15, company: 10, description: 5, location: 3, tags: 2 },
      name: 'pipeline_job_fulltext' },
  ]);
  console.log('Jobs indexes: OK');

  const companies = db.collection('companyregistries');
  await companies.createIndexes([
    { key: { name: 1 }, unique: true, name: 'idx_registry_name' },
    { key: { careersPlatform: 1 }, name: 'idx_registry_platform' },
    { key: { batch: 1 }, name: 'idx_registry_batch' },
    { key: { active: 1 }, name: 'idx_registry_active' },
    { key: { normalizedName: 1 }, name: 'idx_registry_normalized' },
  ]);
  console.log('CompanyRegistry indexes: OK');

  const runs = db.collection('pipelineruns');
  await runs.createIndexes([
    { key: { source: 1, startedAt: -1 }, name: 'idx_run_source' },
    { key: { status: 1 }, name: 'idx_run_status' },
    { key: { startedAt: -1 }, name: 'idx_run_started' },
  ]);
  console.log('PipelineRun indexes: OK');

  console.log('\nAll pipeline indexes created successfully!');
  await mongoose.disconnect();
}

setupPipelineIndexes().catch(err => {
  console.error('Index setup failed:', err.message);
  process.exit(1);
});

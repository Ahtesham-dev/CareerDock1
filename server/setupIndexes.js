require('dotenv').config();
const mongoose = require('mongoose');

async function setupIndexes() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB — setting up indexes...');

  const db = mongoose.connection.db;

  // === Jobs Collection ===
  const jobs = db.collection('jobs');
  await jobs.createIndexes([
    { key: { title: 'text', company: 'text', description: 'text', skills: 'text', location: 'text' },
      weights: { title: 30, skills: 15, company: 10, description: 5, location: 3 },
      name: 'job_fulltext' },
    { key: { postedAt: -1 }, name: 'idx_postedAt' },
    { key: { source: 1, postedAt: -1 }, name: 'idx_source_posted' },
    { key: { skills: 1 }, name: 'idx_skills' },
    { key: { qualityScore: -1 }, name: 'idx_quality' },
    { key: { dupGroup: 1 }, name: 'idx_dupGroup' },
    { key: { dupFlagged: 1 }, name: 'idx_dupFlagged' },
    { key: { salaryMin: -1 }, name: 'idx_salaryMin' },
    { key: { location: 1 }, name: 'idx_location' },
    { key: { experience: 1 }, name: 'idx_experience' },
    { key: { type: 1 }, name: 'idx_type' },
    { key: { company: 1 }, name: 'idx_company' },
    { key: { title: 1, company: 1, source: 1 }, name: 'idx_title_company_source', unique: false },
  ]);
  console.log('Jobs indexes: OK');

  // === Users Collection ===
  const users = db.collection('users');
  await users.createIndexes([
    { key: { email: 1 }, unique: true, name: 'idx_email' },
    { key: { skills: 1 }, name: 'idx_user_skills' },
  ]);
  console.log('Users indexes: OK');

  // === User Profiles Collection ===
  const profiles = db.collection('userprofiles');
  await profiles.createIndexes([
    { key: { userId: 1 }, unique: true, name: 'idx_profile_user' },
    { key: { skills: 1 }, name: 'idx_profile_skills' },
    { key: { preferredLocations: 1 }, name: 'idx_preferred_locations' },
  ]);
  console.log('UserProfiles indexes: OK');

  // === Saved Jobs Collection ===
  const saved = db.collection('savedjobs');
  await saved.createIndexes([
    { key: { userId: 1, jobId: 1 }, unique: true, name: 'idx_user_job' },
    { key: { userId: 1, column: 1 }, name: 'idx_user_column' },
    { key: { savedAt: -1 }, name: 'idx_savedAt' },
  ]);
  console.log('SavedJobs indexes: OK');

  // === Applications Collection ===
  const applications = db.collection('applications');
  await applications.createIndexes([
    { key: { userId: 1, jobId: 1 }, name: 'idx_app_user_job' },
    { key: { userId: 1, status: 1 }, name: 'idx_app_user_status' },
    { key: { appliedDate: -1 }, name: 'idx_appliedDate' },
  ]);
  console.log('Applications indexes: OK');

  // === Job Feedback Collection ===
  const feedback = db.collection('jobfeedbacks');
  await feedback.createIndexes([
    { key: { userId: 1, jobId: 1 }, unique: true, name: 'idx_feedback_user_job' },
    { key: { jobId: 1, vote: 1 }, name: 'idx_feedback_job_vote' },
  ]);
  console.log('JobFeedback indexes: OK');

  // === Job Alerts Collection ===
  const alerts = db.collection('jobalerts');
  await alerts.createIndexes([
    { key: { userId: 1 }, name: 'idx_alert_user' },
    { key: { isActive: 1, lastCheckedAt: 1 }, name: 'idx_alert_active' },
    { key: { keywords: 'text', location: 'text' }, name: 'idx_alert_text' },
  ]);
  console.log('JobAlerts indexes: OK');

  // === Recommendations Collection ===
  const recommendations = db.collection('recommendations');
  await recommendations.createIndexes([
    { key: { userId: 1, type: 1 }, name: 'idx_rec_user_type' },
    { key: { 'items.score': -1 }, name: 'idx_rec_score' },
    { key: { generatedAt: 1 }, expireAfterSeconds: 86400, name: 'idx_rec_ttl' },
  ]);
  console.log('Recommendations indexes: OK');

  // === Skills Collection ===
  const skills = db.collection('skills');
  await skills.createIndexes([
    { key: { name: 1 }, unique: true, name: 'idx_skill_name' },
    { key: { demandCount: -1 }, name: 'idx_skill_demand' },
    { key: { growthRate: -1 }, name: 'idx_skill_growth' },
    { key: { name: 'text', aliases: 'text' }, name: 'idx_skill_text' },
  ]);
  console.log('Skills indexes: OK');

  // === Companies Collection ===
  const companies = db.collection('companies');
  await companies.createIndexes([
    { key: { name: 1 }, unique: true, name: 'idx_company_name' },
    { key: { totalJobs: -1 }, name: 'idx_company_jobs' },
    { key: { avgQualityScore: -1 }, name: 'idx_company_quality' },
    { key: { name: 'text', aliases: 'text' }, name: 'idx_company_text' },
  ]);
  console.log('Companies indexes: OK');

  console.log('\nAll indexes created successfully!');
  await mongoose.disconnect();
}

setupIndexes().catch(err => {
  console.error('Index setup failed:', err.message);
  process.exit(1);
});

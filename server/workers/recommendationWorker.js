const RecommendationEngine = require('../engine/recommendation');
const User = require('../models/User');
const Recommendation = require('../models/Recommendation');

async function runRecommendationWorker(options = {}) {
  const { batchSize = 50 } = options;

  console.log(`[Worker:Rec] Starting recommendation generation`);

  try {
    const users = await User.find({}).limit(batchSize).lean();
    console.log(`[Worker:Rec] Generating recommendations for ${users.length} users`);

    let generated = 0;
    for (const user of users) {
      try {
        const [jobs, skills, companies, careerPaths] = await Promise.all([
          RecommendationEngine.getRecommendations(user._id, { limit: 10 }),
          RecommendationEngine.getSkillRecommendations(user._id),
          RecommendationEngine.getCompanyRecommendations(user._id),
          RecommendationEngine.getCareerPathRecommendations(user._id),
        ]);

        const recommendations = [];

        if (jobs.length > 0) {
          recommendations.push({
            type: 'job',
            items: jobs.map(j => ({
              targetId: j._id,
              targetType: 'Job',
              label: `${j.title} at ${j.company}`,
              score: j.recommendationScore || 0,
              reason: `${j.skills?.length || 0} matching skills`,
              metadata: { source: j.source, location: j.location, salary: j.salaryLabel },
            })),
          });
        }

        if (skills.length > 0) {
          recommendations.push({
            type: 'skill',
            items: skills.map(s => ({
              targetType: 'Skill',
              label: s.skill,
              score: s.demandScore,
              reason: s.reason,
              metadata: { demandScore: s.demandScore, openJobs: s.openJobs },
            })),
          });
        }

        if (companies.length > 0) {
          recommendations.push({
            type: 'company',
            items: companies.map(c => ({
              targetType: 'Company',
              label: c.company,
              score: c.openJobs,
              reason: `${c.openJobs} open positions`,
              metadata: { avgSalary: c.avgSalary, avgQuality: c.avgQuality },
            })),
          });
        }

        if (careerPaths.length > 0) {
          recommendations.push({
            type: 'career_path',
            items: careerPaths.map(p => ({
              targetType: 'CareerPath',
              label: p.role,
              score: p.openJobs,
              reason: `${p.skillGap.length} skills needed`,
              metadata: { avgSalary: p.avgSalary, skillGap: p.skillGap, difficulty: p.transitionDifficulty },
            })),
          });
        }

        if (recommendations.length > 0) {
          await Recommendation.deleteMany({ userId: user._id });
          for (const rec of recommendations) {
            await Recommendation.create({ userId: user._id, ...rec });
          }
          generated++;
        }
      } catch (userErr) {
        console.error(`[Worker:Rec] Error for user ${user._id}: ${userErr.message}`);
      }
    }

    console.log(`[Worker:Rec] Complete — generated recommendations for ${generated} users`);
    return { generated };
  } catch (err) {
    console.error(`[Worker:Rec] Error:`, err.message);
    throw err;
  }
}

if (require.main === module) {
  const batch = parseInt(process.argv[2]) || 50;
  runRecommendationWorker({ batchSize: batch })
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runRecommendationWorker };

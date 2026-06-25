const Job = require('../models/Job');
const SavedJob = require('../models/SavedJob');
const Application = require('../models/Application');
const JobFeedback = require('../models/JobFeedback');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const RankingEngine = require('./ranking');
const {
  jaccardSimilarity, cosineSimilarityVectors, getEmbedding,
  normalizeTitle, classifyRole,
} = require('../services/embeddings');

class RecommendationEngine {
  async getRecommendations(userId, options = {}) {
    const { limit = 20, includeViewed = false } = options;

    const [user, profile, savedJobs, applications, feedback] = await Promise.all([
      User.findById(userId).lean(),
      UserProfile.findOne({ userId }).lean(),
      SavedJob.find({ userId }).lean(),
      Application.find({ userId }).lean(),
      JobFeedback.find({ userId }).lean(),
    ]);

    if (!user) return [];

    const excludedIds = new Set([
      ...savedJobs.map(s => s.jobId?.toString()).filter(Boolean),
      ...applications.map(a => a.jobId?.toString()).filter(Boolean),
    ]);

    const downvotedIds = new Set(
      feedback.filter(f => f.vote === 'down').map(f => f.jobId?.toString()).filter(Boolean)
    );
    const upvotedIds = new Set(
      feedback.filter(f => f.vote === 'up').map(f => f.jobId?.toString()).filter(Boolean)
    );

    const userSkills = new Set((user.skills || []).map(s => s.toLowerCase().trim()));
    const profileSkills = new Set((profile?.skills || []).map(s => s.toLowerCase().trim()));
    const allSkills = new Set([...userSkills, ...profileSkills]);

    const preferredLocations = new Set((profile?.preferredLocations || []).map(l => l.toLowerCase().trim()));
    const preferredTypes = new Set((profile?.preferredJobTypes || []).map(t => t.toLowerCase().trim()));
    const preferredSalary = profile?.preferredSalary || 0;
    const remoteOnly = profile?.remoteOnly || false;

    let jobs = await Job.find({
      ...(excludedIds.size > 0 ? { _id: { $nin: [...excludedIds] } } : {}),
    }).sort({ postedAt: -1 }).limit(500).lean();

    const scored = jobs.map(job => {
      let score = 0;

      const jobSkills = new Set((job.skills || []).map(s => s.toLowerCase().trim()));
      const matchedSkills = [...allSkills].filter(s => jobSkills.has(s)).length;
      const skillRatio = allSkills.size > 0 ? matchedSkills / allSkills.size : 0;
      score += skillRatio * 40;

      const loc = (job.location || '').toLowerCase();
      if (remoteOnly && loc === 'remote') score += 15;
      else if (preferredLocations.size > 0) {
        if ([...preferredLocations].some(l => loc.includes(l) || l.includes(loc))) score += 12;
      } else {
        score += 5;
      }

      const type = (job.type || '').toLowerCase();
      if (preferredTypes.size > 0 && [...preferredTypes].some(t => type.includes(t))) score += 8;

      if (preferredSalary > 0 && (job.salaryMin >= preferredSalary || job.salaryMax >= preferredSalary)) {
        score += 5;
      }

      if (downvotedIds.has(job._id.toString())) score -= 30;
      if (upvotedIds.has(job._id.toString())) score += 15;

      if (job.qualityScore) score += job.qualityScore * 0.3;

      const savedCount = savedJobs.filter(s => {
        const sJobId = s.jobId?.toString();
        return sJobId && s.column === 'saved';
      }).length;
      if (savedCount > 0 && allSkills.size > 0) {
        const savedJobSkills = new Set();
        savedJobs.forEach(s => {
          if (s.skills) s.skills.forEach(sk => savedJobSkills.add(sk.toLowerCase()));
        });
        const overlap = [...savedJobSkills].filter(s => jobSkills.has(s)).length;
        score += overlap * 3;
      }

      return { ...job, recommendationScore: Math.round(score * 10) / 10 };
    });

    scored.sort((a, b) => b.recommendationScore - a.recommendationScore);
    return scored.slice(0, limit);
  }

  async getSkillRecommendations(userId) {
    const [user, savedJobs, applications] = await Promise.all([
      User.findById(userId).lean(),
      SavedJob.find({ userId }).populate('jobId').lean(),
      Application.find({ userId }).lean(),
    ]);

    const userSkills = new Set((user?.skills || []).map(s => s.toLowerCase().trim()));
    const trendingSkills = await Job.aggregate([
      { $unwind: '$skills' },
      { $group: { _id: { $toLower: '$skills' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 30 },
    ]);

    const savedJobSkills = new Set();
    for (const saved of savedJobs) {
      if (saved.jobId?.skills) {
        saved.jobId.skills.forEach(s => savedJobSkills.add(s.toLowerCase().trim()));
      }
    }

    const suggestions = [];
    for (const skill of trendingSkills) {
      const name = skill._id;
      if (!userSkills.has(name) && !savedJobSkills.has(name)) {
        const demandScore = Math.min(100, (skill.count / trendingSkills[0].count) * 100);
        suggestions.push({
          skill: name,
          demandScore: Math.round(demandScore),
          openJobs: skill.count,
          reason: `${skill.count} jobs require this skill`,
        });
      }
    }

    return suggestions.sort((a, b) => b.demandScore - a.demandScore).slice(0, 10);
  }

  async getCompanyRecommendations(userId) {
    const savedJobs = await SavedJob.find({ userId }).populate('jobId').lean();
    const likedCompanies = new Set();
    savedJobs.forEach(s => {
      if (s.jobId?.company) likedCompanies.add(s.jobId.company.toLowerCase().trim());
    });

    const topHiring = await Job.aggregate([
      { $group: { _id: '$company', count: { $sum: 1 }, avgSalary: { $avg: '$salaryMin' }, avgQuality: { $avg: { $ifNull: ['$qualityScore', 50] } } } },
      { $sort: { count: -1, avgQuality: -1 } },
      { $limit: 20 },
    ]);

    return topHiring
      .filter(c => !likedCompanies.has(c._id.toLowerCase().trim()))
      .map(c => ({
        company: c._id,
        openJobs: c.count,
        avgSalary: c.avgSalary,
        avgQuality: Math.round(c.avgQuality),
      }));
  }

  async getCareerPathRecommendations(userId) {
    const user = await User.findById(userId).lean();
    if (!user) return [];

    const userSkills = new Set((user.skills || []).map(s => s.toLowerCase().trim()));
    const roleCounts = await Job.aggregate([
      { $project: { title: 1 } },
      { $group: { _id: null, titles: { $push: '$title' } } },
    ]);

    const roleGroups = {};
    const allJobs = await Job.find({}).limit(1000).lean();
    for (const job of allJobs) {
      const role = classifyRole(job.title);
      if (!roleGroups[role]) roleGroups[role] = { count: 0, skillSet: new Set(), avgSalary: 0, totalSalary: 0 };
      roleGroups[role].count++;
      (job.skills || []).forEach(s => roleGroups[role].skillSet.add(s.toLowerCase().trim()));
      if (job.salaryMin) {
        roleGroups[role].totalSalary += job.salaryMin;
      }
    }

    const currentRole = classifyRole(user.title || '');
    const paths = Object.entries(roleGroups)
      .filter(([role]) => role !== currentRole)
      .map(([role, data]) => {
        const missingSkills = [...data.skillSet].filter(s => !userSkills.has(s));
        const avgSalary = data.count > 0 ? Math.round(data.totalSalary / data.count) : 0;
        return {
          role: role.charAt(0).toUpperCase() + role.slice(1),
          openJobs: data.count,
          avgSalary,
          skillGap: missingSkills.slice(0, 5),
          transitionDifficulty: missingSkills.length <= 2 ? 'Easy' : missingSkills.length <= 5 ? 'Moderate' : 'Challenging',
        };
      })
      .sort((a, b) => b.openJobs - a.openJobs)
      .slice(0, 5);

    return paths;
  }
}

module.exports = new RecommendationEngine();

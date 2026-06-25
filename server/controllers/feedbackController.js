const JobFeedback = require('../models/JobFeedback');
const UserProfile = require('../models/UserProfile');
const Job = require('../models/Job');

const submitFeedback = async (userId, jobId, vote, reason) => {
  if (!['up', 'down'].includes(vote)) throw new Error('Vote must be up or down');
  return JobFeedback.findOneAndUpdate(
    { userId, jobId },
    { vote, reason },
    { upsert: true, new: true }
  );
};

const getFeedbackStats = async (userId) => {
  const total = await JobFeedback.countDocuments({ userId });
  const up = await JobFeedback.countDocuments({ userId, vote: 'up' });
  const down = await JobFeedback.countDocuments({ userId, vote: 'down' });
  return { total, up, down, ratio: total > 0 ? up / total : 0 };
};

const getRecommendations = async (userId) => {
  const profile = await UserProfile.findOne({ userId });
  const feedbacks = await JobFeedback.find({ userId });
  const dislikedIds = feedbacks.filter(f => f.vote === 'down').map(f => f.jobId.toString());
  const filter = {};
  if (profile?.skills?.length) filter.skills = { $in: profile.skills };
  const jobs = await Job.find(filter).limit(50);
  return jobs.map(job => {
    let score = 0;
    if (profile?.skills) {
      profile.skills.forEach(s => {
        if (job.skills?.some(js => js.toLowerCase().includes(s.toLowerCase()))) score += 10;
      });
    }
    if (dislikedIds.includes(job._id.toString())) score -= 10;
    return { ...job.toObject(), score };
  }).sort((a, b) => b.score - a.score).slice(0, 20);
};

module.exports = { submitFeedback, getFeedbackStats, getRecommendations };

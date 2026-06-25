const UserProfile = require('../models/UserProfile');
const Job = require('../models/Job');

const getProfile = async (userId) => {
  let profile = await UserProfile.findOne({ userId });
  if (!profile) {
    profile = await UserProfile.create({ userId });
  }
  return profile;
};

const updateProfile = async (userId, data) => {
  return UserProfile.findOneAndUpdate({ userId }, data, { upsert: true, new: true });
};

const getPersonalizedJobs = async (userId) => {
  const profile = await getProfile(userId);
  if (!profile.skills.length && !profile.preferredLocations.length) return [];
  const filter = {};
  if (profile.skills.length) filter.skills = { $in: profile.skills };
  if (profile.remoteOnly) {
    filter.type = 'Remote';
  } else if (profile.preferredJobTypes.length) {
    filter.type = { $in: profile.preferredJobTypes };
  }
  const jobs = await Job.find(filter).limit(50);
  return jobs.map(job => {
    let score = 0;
    profile.skills.forEach(s => {
      if (job.skills?.some(js => js.toLowerCase().includes(s.toLowerCase()))) score += 10;
    });
    profile.preferredLocations.forEach(loc => {
      if (job.location?.toLowerCase().includes(loc.toLowerCase())) score += 5;
    });
    if (profile.preferredSalary > 0 && job.salaryMax >= profile.preferredSalary * 100000) score += 3;
    return { ...job.toObject(), score };
  }).sort((a, b) => b.score - a.score);
};

module.exports = { getProfile, updateProfile, getPersonalizedJobs };

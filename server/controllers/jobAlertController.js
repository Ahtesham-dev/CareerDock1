const Job = require('../models/Job');

const buildJobQuery = (alert) => {
  const query = { postedAt: { $gt: alert.lastCheckedAt || new Date(0) } };
  if (alert.keywords) {
    const keywords = alert.keywords.split(',').map(k => k.trim()).filter(Boolean);
    const regexQueries = keywords.map(k => ({
      $or: [
        { title: { $regex: k, $options: 'i' } },
        { company: { $regex: k, $options: 'i' } },
        { skills: { $regex: k, $options: 'i' } }
      ]
    }));
    query.$or = regexQueries;
  }
  if (alert.location) {
    query.location = { $regex: alert.location, $options: 'i' };
  }
  if (alert.minSalary > 0) {
    query.salaryMax = { $gte: alert.minSalary * 100000 };
  }
  if (alert.employmentType) {
    query.type = alert.employmentType;
  }
  return query;
};

const checkAlert = async (alert) => {
  const query = buildJobQuery(alert);
  return Job.find(query).sort({ postedAt: -1 }).limit(20);
};

module.exports = { buildJobQuery, checkAlert };

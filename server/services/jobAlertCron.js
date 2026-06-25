const JobAlert = require('../models/JobAlert');
const User = require('../models/User');
const Job = require('../models/Job');
const { sendJobAlert } = require('./email');

const checkAlerts = async () => {
  const alerts = await JobAlert.find({ isActive: true });
  for (const alert of alerts) {
    const query = { postedAt: { $gt: alert.lastCheckedAt || new Date(0) } };
    if (alert.keywords) {
      const keywords = alert.keywords.split(',').map(k => k.trim()).filter(Boolean);
      const orConditions = keywords.map(k => ({
        $or: [
          { title: { $regex: k, $options: 'i' } },
          { company: { $regex: k, $options: 'i' } },
          { skills: { $regex: k, $options: 'i' } }
        ]
      }));
      query.$or = orConditions;
    }
    if (alert.location) query.location = { $regex: alert.location, $options: 'i' };
    if (alert.minSalary > 0) query.salaryMax = { $gte: alert.minSalary * 100000 };
    if (alert.employmentType) query.type = alert.employmentType;
    try {
      const jobs = await Job.find(query).sort({ postedAt: -1 }).limit(20);
      if (jobs.length > 0) {
        const user = await User.findById(alert.userId);
        if (user) {
          await sendJobAlert(user.email, jobs, alert);
        }
      }
      alert.lastCheckedAt = new Date();
      await alert.save();
    } catch { }
  }
};

module.exports = { checkAlerts };

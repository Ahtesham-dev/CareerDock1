const express = require('express');
const Job = require('../models/Job');
const Application = require('../models/Application');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const totalJobs = await Job.countDocuments();
    const avgSalaryResult = await Job.aggregate([
      { $match: { salaryMax: { $gt: 0 } } },
      { $group: { _id: null, avg: { $avg: '$salaryMax' } } }
    ]);
    const avgSalary = avgSalaryResult[0]?.avg || 0;
    const remoteCount = await Job.countDocuments({ type: 'Remote' });
    const remotePercent = totalJobs > 0 ? Math.round((remoteCount / totalJobs) * 100) : 0;
    const byPlatform = await Job.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const topSkills = await Job.aggregate([
      { $unwind: '$skills' },
      { $group: { _id: '$skills', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 12 }
    ]);
    const byType = await Job.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const byExp = await Job.aggregate([
      { $group: { _id: '$experience', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const topLocations = await Job.aggregate([
      { $group: { _id: '$location', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 }
    ]);
    const salaryRange = await Job.aggregate([
      { $group: { _id: null, min: { $min: '$salaryMin' }, max: { $max: '$salaryMax' } } }
    ]);
    const totalJobsWithSalary = await Job.countDocuments({ salaryMax: { $gt: 0 } });
    const appsByStatus = await Application.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    res.json({
      totalJobs, avgSalary, remotePercent, byPlatform, topSkills,
      byType, byExp, topLocations,
      salaryRange: salaryRange[0] || { min: 0, max: 0 },
      totalJobsWithSalary, appsByStatus
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

const Job = require('../models/Job');
const SavedJob = require('../models/SavedJob');
const Application = require('../models/Application');
const JobFeedback = require('../models/JobFeedback');
const mongoose = require('mongoose');

class CareerIntelligence {
  async salaryIntelligence(filters = {}) {
    const match = {};
    if (filters.skill) match.skills = { $in: [new RegExp(filters.skill, 'i')] };
    if (filters.location) match.location = { $regex: filters.location, $options: 'i' };
    if (filters.source) match.source = filters.source;

    const pipeline = [
      { $match: { ...match, salaryMin: { $gt: 0 } } },
      {
        $group: {
          _id: null,
          avgSalary: { $avg: '$salaryMin' },
          medianSalary: { $avg: '$salaryMin' },
          minSalary: { $min: '$salaryMin' },
          maxSalary: { $max: '$salaryMin' },
          count: { $sum: 1 },
          p25: { $avg: '$salaryMin' },
          p75: { $avg: '$salaryMin' },
        },
      },
    ];
    const result = await Job.aggregate(pipeline);

    const byRole = await Job.aggregate([
      { $match: { ...match, salaryMin: { $gt: 0 } } },
      {
        $group: {
          _id: '$experience',
          avgSalary: { $avg: '$salaryMin' },
          count: { $sum: 1 },
        },
      },
      { $sort: { avgSalary: -1 } },
    ]);

    const byLocation = await Job.aggregate([
      { $match: { ...match, salaryMin: { $gt: 0 }, location: { $ne: 'Remote' } } },
      {
        $group: {
          _id: '$location',
          avgSalary: { $avg: '$salaryMin' },
          count: { $sum: 1 },
        },
      },
      { $sort: { avgSalary: -1 } },
      { $limit: 10 },
    ]);

    const bySkill = await Job.aggregate([
      { $match: { ...match, salaryMin: { $gt: 0 }, skills: { $exists: true, $ne: [] } } },
      { $unwind: '$skills' },
      {
        $group: {
          _id: { $toLower: '$skills' },
          avgSalary: { $avg: '$salaryMin' },
          count: { $sum: 1 },
        },
      },
      { $sort: { avgSalary: -1 } },
      { $limit: 20 },
    ]);

    return {
      overall: result[0] || {},
      byRole,
      byLocation,
      bySkill,
    };
  }

  async skillIntelligence() {
    const now = new Date();

    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const lastQuarter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const lastYear = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const [monthSkills, quarterSkills, totalSkills] = await Promise.all([
      Job.aggregate([
        { $match: { postedAt: { $gte: lastMonth }, skills: { $exists: true, $ne: [] } } },
        { $unwind: '$skills' },
        { $group: { _id: { $toLower: '$skills' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 50 },
      ]),
      Job.aggregate([
        { $match: { postedAt: { $gte: lastQuarter }, skills: { $exists: true, $ne: [] } } },
        { $unwind: '$skills' },
        { $group: { _id: { $toLower: '$skills' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 50 },
      ]),
      Job.aggregate([
        { $match: { postedAt: { $gte: lastYear }, skills: { $exists: true, $ne: [] } } },
        { $unwind: '$skills' },
        { $group: { _id: { $toLower: '$skills' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 50 },
      ]),
    ]);

    const monthMap = new Map(monthSkills.map(s => [s._id, s.count]));
    const quarterMap = new Map(quarterSkills.map(s => [s._id, s.count]));
    const totalMap = new Map(totalSkills.map(s => [s._id, s.count]));

    const allSkills = new Set([...monthMap.keys(), ...quarterMap.keys(), ...totalMap.keys()]);
    const analysis = [];

    for (const skill of allSkills) {
      const monthly = monthMap.get(skill) || 0;
      const quarterly = quarterMap.get(skill) || 0;
      const yearly = totalMap.get(skill) || 0;

      const growthRate = quarterly > 0 ? ((monthly - quarterly / 3) / (quarterly / 3)) * 100 : 0;
      const trend = growthRate > 30 ? 'Rapid Growth' : growthRate > 10 ? 'Growing' : growthRate > -10 ? 'Stable' : 'Declining';

      const salaryData = await Job.aggregate([
        { $match: { skills: { $regex: new RegExp(`^${skill}$`, 'i') }, salaryMin: { $gt: 0 } } },
        { $group: { _id: null, avgSalary: { $avg: '$salaryMin' } } },
      ]);

      analysis.push({
        skill,
        monthlyDemand: monthly,
        quarterlyDemand: quarterly,
        yearlyDemand: yearly,
        growthRate: Math.round(growthRate * 10) / 10,
        trend,
        avgSalary: salaryData[0]?.avgSalary || 0,
      });
    }

    return {
      rising: analysis.filter(s => s.trend === 'Rapid Growth').sort((a, b) => b.growthRate - a.growthRate),
      growing: analysis.filter(s => s.trend === 'Growing').sort((a, b) => b.growthRate - a.growthRate),
      topDemand: analysis.sort((a, b) => b.monthlyDemand - a.monthlyDemand).slice(0, 20),
      analyzed: analysis.length,
    };
  }

  async locationIntelligence() {
    const locations = await Job.aggregate([
      { $match: { location: { $ne: '' }, salaryMin: { $gt: 0 } } },
      {
        $group: {
          _id: '$location',
          jobCount: { $sum: 1 },
          avgSalary: { $avg: '$salaryMin' },
          remoteCount: { $sum: { $cond: [{ $eq: ['$location', 'Remote'] }, 1, 0] } },
          companyCount: { $addToSet: '$company' },
          sourceCount: { $addToSet: '$source' },
        },
      },
      {
        $project: {
          location: '$_id',
          jobCount: 1,
          avgSalary: { $round: ['$avgSalary', 0] },
          remotePercent: { $multiply: [{ $divide: ['$remoteCount', '$jobCount'] }, 100] },
          uniqueCompanies: { $size: '$companyCount' },
          uniqueSources: { $size: '$sourceCount' },
        },
      },
      { $sort: { jobCount: -1 } },
      { $limit: 20 },
    ]);

    const remoteGrowth = await Job.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$postedAt' },
            month: { $month: '$postedAt' },
            isRemote: { $eq: ['$location', 'Remote'] },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    return { topLocations: locations, remoteGrowth };
  }

  async hiringIntelligence() {
    const now = new Date();
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const lastQuarter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const [monthlyTrend, topCompanies, roleDistribution, sourceTrend] = await Promise.all([
      Job.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$postedAt' },
              month: { $month: '$postedAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 },
      ]),
      Job.aggregate([
        { $match: { postedAt: { $gte: lastMonth } } },
        { $group: { _id: '$company', jobs: { $sum: 1 }, avgQuality: { $avg: { $ifNull: ['$qualityScore', 50] } } } },
        { $sort: { jobs: -1, avgQuality: -1 } },
        { $limit: 20 },
      ]),
      Job.aggregate([
        { $match: { postedAt: { $gte: lastMonth } } },
        { $group: { _id: '$experience', count: { $sum: 1 }, avgSalary: { $avg: '$salaryMin' } } },
        { $sort: { count: -1 } },
      ]),
      Job.aggregate([
        { $match: { postedAt: { $gte: lastQuarter } } },
        { $group: { _id: '$source', count: { $sum: 1 }, avgSalary: { $avg: { $ifNull: ['$salaryMin', 0] } } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return {
      monthlyTrend,
      topCompanies,
      roleDistribution,
      sourceTrend,
    };
  }

  async trendSummary() {
    const [skills, salaries, locations, hiring] = await Promise.all([
      this.skillIntelligence(),
      this.salaryIntelligence(),
      this.locationIntelligence(),
      this.hiringIntelligence(),
    ]);

    return {
      topRisingSkills: skills.rising.slice(0, 5),
      topPayingLocations: salaries.byLocation.slice(0, 5),
      topPayingSkills: salaries.bySkill.slice(0, 5),
      topHiringCompanies: hiring.topCompanies.slice(0, 5),
      topGrowingRoles: hiring.roleDistribution,
      remotePercent: locations.topLocations.find(l => l.location === 'Remote')?.remotePercent || 0,
    };
  }
}

module.exports = new CareerIntelligence();

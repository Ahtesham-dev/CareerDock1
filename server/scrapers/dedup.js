const crypto = require('crypto');
const Job = require('../models/Job');

const normaliseTitle = (title) => {
  return (title || '')
    .toLowerCase()
    .replace(/\s*(senior|jr\.?|sr\.?|junior|lead|principal|staff|i|ii|iii|iv)\s*/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const normaliseCompany = (name) => {
  return (name || '')
    .toLowerCase()
    .replace(/pvt\s*ltd|private\s*limited|limited|ltd|inc|corp|corporation|technologies|technology|solutions|software|\.com|,?\s*llc/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const classifyRole = (title) => {
  const t = (title || '').toLowerCase();
  if (/frontend|front.end|react|vue|angular|web\s*developer|ui\s*developer/i.test(t)) return 'Frontend';
  if (/backend|back.end|node|express|django|spring|api/i.test(t)) return 'Backend';
  if (/full.?stack|mern|mean/i.test(t)) return 'FullStack';
  if (/data.?scientist|data.?engineer|data.?analyst|machine.?learning|ml|ai/i.test(t)) return 'Data';
  if (/devops|sre|infrastructure|platform|cloud/i.test(t)) return 'DevOps';
  if (/mobile|android|ios|react.?native|flutter/i.test(t)) return 'Mobile';
  if (/qa|test|quality|sdet/i.test(t)) return 'QA';
  return 'General';
};

const levenshtein = (a, b) => {
  const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }
  return 1 - matrix[a.length][b.length] / Math.max(a.length, b.length);
};

const generateHash = (title, company, location) => {
  return crypto.createHash('sha256').update([
    (title || '').toLowerCase().trim(),
    (company || '').toLowerCase().trim(),
    (location || 'Remote').toLowerCase().trim()
  ].join('|||')).digest('hex');
};

const deduplicateJobs = async () => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const jobs = await Job.find({
    $or: [
      { postedAt: { $gte: sevenDaysAgo } },
      { dupGroup: { $ne: null } }
    ]
  }).lean();

  if (jobs.length < 2) return { groups: 0, duplicates: 0, hashMatches: 0 };

  // Phase 1: Hash-based exact dedup (fast path)
  const hashIndex = new Map();
  let hashMatches = 0;
  for (const job of jobs) {
    const jobHash = job.hash || generateHash(job.title, job.company, job.location);
    const existing = hashIndex.get(jobHash);
    if (existing) {
      if (!job.dupGroup) {
        const gid = existing.dupGroup || `dup-${Date.now()}-hash-${hashMatches}`;
        await Job.findByIdAndUpdate(job._id, { dupGroup: gid });
        if (!existing.dupGroup) {
          await Job.findByIdAndUpdate(existing._id, { dupGroup: gid });
        }
        hashMatches++;
      }
    } else {
      hashIndex.set(jobHash, job);
    }
  }

  // Phase 2: Fuzzy dedup (O(n^2) on ungrouped jobs only)
  const dupGroupId = `dup-${Date.now()}`;
  let groups = 0;
  let duplicates = 0;

  const ungroupedJobs = jobs.filter(j => !j.dupGroup);
  for (let i = 0; i < ungroupedJobs.length; i++) {
    if (ungroupedJobs[i].dupGroup) continue;
    const group = [ungroupedJobs[i]];

    for (let j = i + 1; j < ungroupedJobs.length; j++) {
      if (ungroupedJobs[j].dupGroup) continue;
      const titleSim = levenshtein(normaliseTitle(ungroupedJobs[i].title), normaliseTitle(ungroupedJobs[j].title));
      const companySim = levenshtein(normaliseCompany(ungroupedJobs[i].company), normaliseCompany(ungroupedJobs[j].company));
      const familyBonus = classifyRole(ungroupedJobs[i].title) === classifyRole(ungroupedJobs[j].title) ? 0.15 : 0;
      const weightedScore = (titleSim * 0.50) + (companySim * 0.35) + familyBonus;

      if (weightedScore >= 0.65 && companySim >= 0.80) {
        group.push(ungroupedJobs[j]);
      }
    }

    if (group.length > 1) {
      const gid = `${dupGroupId}-${groups}`;
      for (const job of group) {
        await Job.findByIdAndUpdate(job._id, { dupGroup: gid });
      }
      groups++;
      duplicates += group.length;
    }
  }

  await Job.updateMany(
    { dupGroup: { $ne: null }, _id: { $nin: jobs.map(j => j._id) } },
    { dupGroup: null }
  );

  return { groups, duplicates, hashMatches, totalCompared: jobs.length };
};

module.exports = { deduplicateJobs };

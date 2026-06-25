const Job = require('../models/Job');

const TITLE_SYNONYMS = {
  'react': ['reactjs', 'react.js', 'react developer', 'frontend react'],
  'node': ['nodejs', 'node.js', 'node developer', 'backend node', 'server side'],
  'python': ['python developer', 'python engineer', 'django', 'flask'],
  'java': ['java developer', 'java engineer', 'spring boot', 'j2ee'],
  'frontend': ['front-end', 'front end', 'ui developer', 'ui engineer', 'web developer'],
  'backend': ['back-end', 'back end', 'server side', 'api developer'],
  'fullstack': ['full-stack', 'full stack', 'mern', 'mean'],
  'devops': ['devops engineer', 'sre', 'platform engineer', 'cloud engineer'],
  'data scientist': ['data science', 'ml engineer', 'machine learning engineer', 'ai engineer'],
  'mobile': ['mobile developer', 'android developer', 'ios developer', 'react native'],
  'product manager': ['pm', 'product management', 'program manager'],
  'designer': ['ui designer', 'ux designer', 'product designer', 'visual designer'],
  'intern': ['internship', 'intern', 'trainee'],
  'fresher': ['entry level', 'junior', 'graduate', '0-1 years'],
  'senior': ['sr', 'lead', 'staff', 'principal'],
  'remote': ['work from home', 'wfh', 'distributed', 'anywhere'],
  'bangalore': ['bengaluru', 'blr', 'bangalore urban'],
  'mumbai': ['bombay', 'mumbai metropolitan'],
  'delhi': ['new delhi', 'delhi ncr', 'ncr', 'gurgaon', 'gurugram', 'noida'],
  'pune': ['pune metropolitan'],
  'hyderabad': ['hyd', 'secunderabad'],
  'chennai': ['madras', 'chennai metropolitan'],
};

class SearchEngine {
  constructor() {
    this.synonymMap = new Map();
    for (const [key, synonyms] of Object.entries(TITLE_SYNONYMS)) {
      this.synonymMap.set(key, new Set([key, ...synonyms]));
      for (const syn of synonyms) {
        if (!this.synonymMap.has(syn)) {
          this.synonymMap.set(syn, new Set([key, ...synonyms]));
        } else {
          for (const s of [key, ...synonyms]) this.synonymMap.get(syn).add(s);
        }
      }
    }
  }

  expandQuery(rawQuery) {
    if (!rawQuery || !rawQuery.trim()) return { tokens: [], expanded: '' };
    const tokens = rawQuery.toLowerCase().split(/\s+/).filter(Boolean);
    const expanded = new Set(tokens);
    for (const token of tokens) {
      if (this.synonymMap.has(token)) {
        for (const syn of this.synonymMap.get(token)) {
          expanded.add(syn);
        }
      }
    }
    return {
      tokens,
      expanded: [...expanded].join(' '),
      expandedArray: [...expanded],
    };
  }

  async search(params) {
    const {
      q, skills, type, exp, sources, location, remote,
      salaryMin, salaryMax,
      page = 1, limit = 20, sort = 'relevance',
    } = params;
    const skip = (page - 1) * limit;

    const pipeline = [];

    const matchStage = { $match: {} };

    if (q && q.trim()) {
      const { tokens, expandedArray } = this.expandQuery(q);
      const escaped = expandedArray.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

      const searchConditions = [
        { title: { $regex: escaped.join('|'), $options: 'i' } },
        { company: { $regex: escaped.join('|'), $options: 'i' } },
        { skills: { $in: escaped } },
      ];

      matchStage.$match.$or = searchConditions;

      pipeline.push(matchStage);

      pipeline.push({
        $addFields: {
          matchScore: {
            $add: [
              { $cond: [{ $regexMatch: { input: '$title', regex: new RegExp(tokens.join('|'), 'i') } }, 10, 0] },
              { $cond: [{ $regexMatch: { input: '$title', regex: new RegExp('^' + escaped[0], 'i') } }, 5, 0] },
              { $cond: [{ $in: [{ $toLower: '$company' }, escaped.map(e => e.toLowerCase())] }, 3, 0] },
              { $multiply: [{ $size: { $ifNull: [{ $setIntersection: ['$skills', escaped] }, []] } }, 2] },
              { $cond: [{ $regexMatch: { input: '$description', regex: new RegExp(tokens.join('|'), 'i') } }, 2, 0] },
            ],
          },
        },
      });
    } else {
      pipeline.push(matchStage);
      pipeline.push({ $addFields: { matchScore: 0 } });
    }

    if (skills && skills.length) {
      const skillArray = Array.isArray(skills) ? skills : skills.split(',').filter(Boolean);
      if (skillArray.length > 0) {
        matchStage.$match.skills = { $in: skillArray.map(s => new RegExp(s.trim(), 'i')) };
      }
    }

    if (type) matchStage.$match.type = type;
    if (exp) matchStage.$match.experience = exp;
    if (sources && sources.length) {
      const srcArray = Array.isArray(sources) ? sources : sources.split(',').filter(Boolean);
      if (srcArray.length > 0) matchStage.$match.source = { $in: srcArray };
    }
    if (location) {
      const locNorm = location.toLowerCase().trim();
      matchStage.$match.location = { $regex: locNorm, $options: 'i' };
    }
    if (remote === 'true' || remote === true) {
      matchStage.$match.$or = matchStage.$match.$or || [];
      matchStage.$match.$or.push(
        { location: { $regex: /remote/i } },
        { type: 'Remote' }
      );
    }
    if (salaryMin) matchStage.$match.salaryMin = { $gte: Number(salaryMin) };
    if (salaryMax) matchStage.$match.salaryMax = { $lte: Number(salaryMax) };

    pipeline.push({
      $addFields: {
        qualityScore: { $ifNull: ['$qualityScore', 50] },
        qualityBreakdown: { $ifNull: ['$qualityBreakdown', {}] },
      },
    });

    const sortStage = {};
    switch (sort) {
      case 'relevance':
        sortStage.matchScore = -1;
        sortStage.qualityScore = -1;
        sortStage.postedAt = -1;
        break;
      case 'newest':
        sortStage.postedAt = -1;
        break;
      case 'salary':
        sortStage.salaryMin = -1;
        break;
      case 'quality':
        sortStage.qualityScore = -1;
        sortStage.postedAt = -1;
        break;
      default:
        sortStage.postedAt = -1;
    }
    pipeline.push({ $sort: sortStage });

    const countPipeline = [...pipeline.slice(0, pipeline.findIndex(s => s.$addFields && s.$addFields.matchScore !== undefined) + 1 || 1)];
    countPipeline.push({ $count: 'total' });
    const countResult = await Job.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    pipeline.push({ $skip: skip }, { $limit: limit });

    pipeline.push({
      $project: {
        title: 1, company: 1, location: 1, type: 1, experience: 1,
        salaryMin: 1, salaryMax: 1, salaryLabel: 1, source: 1,
        description: { $substrCP: ['$description', 0, 500] },
        skills: 1, postedAt: 1, externalUrl: 1, featured: 1,
        dupGroup: 1, qualityScore: 1, qualityBreakdown: 1, matchScore: 1,
      },
    });

    const jobs = await Job.aggregate(pipeline);
    return { jobs, total, page, pages: Math.ceil(total / limit) };
  }

  async autocomplete(prefix) {
    if (!prefix || prefix.trim().length < 2) return [];
    const p = prefix.trim();
    const regex = new RegExp('^' + p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const [titles, skills, companies, locations] = await Promise.all([
      Job.distinct('title', { title: regex }),
      Job.distinct('skills', { skills: regex }),
      Job.distinct('company', { company: regex }),
      Job.distinct('location', { location: regex }),
    ]);

    const results = [];
    for (const title of titles.slice(0, 5)) results.push({ type: 'title', text: title });
    for (const skill of skills.slice(0, 5)) results.push({ type: 'skill', text: skill });
    for (const company of companies.slice(0, 3)) results.push({ type: 'company', text: company });
    for (const location of locations.slice(0, 3)) results.push({ type: 'location', text: location });

    return results.slice(0, 12);
  }

  async correctQuery(query) {
    if (!query || query.trim().length < 3) return { original: query, corrected: query, corrections: [] };
    const tokens = query.toLowerCase().split(/\s+/);
    const corrections = [];

    for (const token of tokens) {
      const exact = await Job.findOne({
        $or: [
          { title: { $regex: new RegExp('^' + token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') } },
          { skills: { $regex: new RegExp('^' + token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') } },
        ],
      });
      if (!exact) {
        const fuzzy = await Job.findOne({
          $or: [
            { title: { $regex: token.split('').join('.{0,1}'), $options: 'i' } },
            { skills: { $regex: token.split('').join('.{0,1}'), $options: 'i' } },
          ],
        });
        if (fuzzy) {
          const matchTitle = fuzzy.title.match(new RegExp(token.split('').join('.{0,1}'), 'i'));
          if (matchTitle) corrections.push({ from: token, to: matchTitle[0] });
        }
      }
    }

    let corrected = query;
    for (const c of corrections) {
      corrected = corrected.replace(new RegExp(c.from, 'i'), c.to);
    }
    return { original: query, corrected, corrections };
  }
}

module.exports = new SearchEngine();

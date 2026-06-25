const RANKING_WEIGHTS = {
  matchScore: 0.35,
  qualityScore: 0.20,
  freshness: 0.15,
  userPreference: 0.15,
  salaryScore: 0.10,
  companyBoost: 0.05,
};

const BOOSTED_COMPANIES = new Set([
  'google', 'microsoft', 'amazon', 'meta', 'apple', 'netflix',
  'stripe', 'shopify', 'datadog', 'snowflake', 'cloudflare',
  'mongodb', 'hashicorp', 'github', 'gitlab',
]);

class RankingEngine {
  computeRanking(jobs, userProfile = null) {
    const ranked = jobs.map(job => {
      const matchScore = this.getMatchScore(job, userProfile);
      const qualityScore = this.getQualityScore(job);
      const freshness = this.getFreshness(job);
      const userPreference = this.getUserPreference(job, userProfile);
      const salaryScore = this.getSalaryScore(job, userProfile);
      const companyBoost = this.getCompanyBoost(job);

      const finalScore =
        (matchScore / 100) * RANKING_WEIGHTS.matchScore +
        (qualityScore / 100) * RANKING_WEIGHTS.qualityScore +
        freshness * RANKING_WEIGHTS.freshness +
        userPreference * RANKING_WEIGHTS.userPreference +
        salaryScore * RANKING_WEIGHTS.salaryScore +
        companyBoost * RANKING_WEIGHTS.companyBoost;

      return {
        ...job,
        rankingScore: Math.round(finalScore * 1000) / 10,
        rankingBreakdown: {
          matchScore: Math.round(matchScore * 10) / 10,
          qualityScore: Math.round(qualityScore * 10) / 10,
          freshness: Math.round(freshness * 100),
          userPreference: Math.round(userPreference * 100),
          salaryScore: Math.round(salaryScore * 100),
          companyBoost: Math.round(companyBoost * 100),
        },
      };
    });

    ranked.sort((a, b) => b.rankingScore - a.rankingScore);
    return ranked;
  }

  getMatchScore(job, profile) {
    if (!profile) return job.matchScore || 50;
    const profileSkills = new Set((profile.skills || []).map(s => s.toLowerCase()));
    const jobSkills = new Set((job.skills || []).map(s => s.toLowerCase()));
    if (profileSkills.size === 0) return job.matchScore || 50;

    const matched = [...profileSkills].filter(s => jobSkills.has(s)).length;
    const ratio = matched / Math.max(profileSkills.size, 1);
    const baseScore = job.matchScore || 0;
    return Math.min(100, Math.max(0, baseScore + ratio * 50));
  }

  getQualityScore(job) {
    return job.qualityScore || 50;
  }

  getFreshness(job) {
    const now = Date.now();
    const posted = new Date(job.postedAt || job.createdAt || now).getTime();
    const ageHours = (now - posted) / (1000 * 60 * 60);
    if (ageHours < 24) return 1.0;
    if (ageHours < 72) return 0.9;
    if (ageHours < 168) return 0.7;
    if (ageHours < 336) return 0.5;
    if (ageHours < 720) return 0.3;
    return 0.1;
  }

  getUserPreference(job, profile) {
    if (!profile) return 0.5;
    let score = 0.5;
    const loc = (job.location || '').toLowerCase();
    const type = (job.type || '').toLowerCase();

    if (profile.remoteOnly && loc === 'remote') score += 0.4;
    if (!profile.remoteOnly && (profile.preferredLocations || []).length > 0) {
      if (profile.preferredLocations.some(l => loc.includes(l.toLowerCase()))) score += 0.3;
    }
    if ((profile.preferredJobTypes || []).length > 0) {
      if (profile.preferredJobTypes.some(t => type.includes(t.toLowerCase()))) score += 0.15;
    }
    if (profile.preferredSalary && profile.preferredSalary > 0) {
      if (job.salaryMin >= profile.preferredSalary || job.salaryMax >= profile.preferredSalary) score += 0.1;
    }
    return Math.min(1, score);
  }

  getSalaryScore(job, profile) {
    if (job.salaryMin || job.salaryMax) {
      const target = profile?.preferredSalary || 0;
      if (target > 0 && job.salaryMin >= target) return 1.0;
      if (job.salaryMin >= 1000000) return 1.0;
      if (job.salaryMin >= 500000) return 0.7;
      if (job.salaryLabel) return 0.5;
      return 0.3;
    }
    return 0;
  }

  getCompanyBoost(job) {
    const company = (job.company || '').toLowerCase().trim();
    if (BOOSTED_COMPANIES.has(company)) return 1.0;
    for (const known of BOOSTED_COMPANIES) {
      if (company.includes(known)) return 0.8;
    }
    return 0;
  }
}

module.exports = new RankingEngine();

const Job = require('../models/Job');

const QUALITY_WEIGHTS = {
  salaryPresent: 0.15,
  remoteOption: 0.10,
  companyReputation: 0.10,
  freshness: 0.15,
  descriptionDetail: 0.15,
  skillRichness: 0.15,
  verifiedCompany: 0.10,
  applicationSimplicity: 0.10,
};

const REPUTABLE_COMPANIES = new Set([
  'google', 'microsoft', 'amazon', 'meta', 'apple', 'netflix', 'uber', 'swiggy',
  'razorpay', 'zomato', 'flipkart', 'myntra', 'phonepe', 'cred', 'groww',
  'zerodha', 'stripe', 'airbnb', 'linkedin', 'twitter', 'salesforce', 'oracle',
  'ibm', 'intel', 'cisco', 'adobe', 'paypal', 'shopify', 'spotify', 'slack',
  'datadog', 'snowflake', 'cloudflare', 'mongodb', 'elastic', 'confluent',
  'hashicorp', 'github', 'gitlab', 'bytedance', 'walmart', 'jpmorgan',
  'goldman sachs', 'bloomberg', 'palantir', 'databricks', 'stripe',
]);

class QualityScorer {
  compute(job) {
    const salaryScore = this.salaryScore(job);
    const remoteScore = this.remoteScore(job);
    const reputationScore = this.reputationScore(job);
    const freshnessScore = this.freshnessScore(job);
    const descriptionScore = this.descriptionScore(job);
    const skillScore = this.skillScore(job);
    const verifiedScore = this.verifiedScore(job);
    const simplicityScore = this.simplicityScore(job);

    const raw =
      salaryScore * QUALITY_WEIGHTS.salaryPresent +
      remoteScore * QUALITY_WEIGHTS.remoteOption +
      reputationScore * QUALITY_WEIGHTS.companyReputation +
      freshnessScore * QUALITY_WEIGHTS.freshness +
      descriptionScore * QUALITY_WEIGHTS.descriptionDetail +
      skillScore * QUALITY_WEIGHTS.skillRichness +
      verifiedScore * QUALITY_WEIGHTS.verifiedCompany +
      simplicityScore * QUALITY_WEIGHTS.applicationSimplicity;

    const qualityScore = Math.round(Math.min(100, Math.max(0, raw * 100)));

    return {
      qualityScore,
      breakdown: {
        salary: Math.round(salaryScore * 100),
        remote: Math.round(remoteScore * 100),
        reputation: Math.round(reputationScore * 100),
        freshness: Math.round(freshnessScore * 100),
        description: Math.round(descriptionScore * 100),
        skills: Math.round(skillScore * 100),
        verified: Math.round(verifiedScore * 100),
        simplicity: Math.round(simplicityScore * 100),
      },
    };
  }

  salaryScore(job) {
    if (job.salaryMin > 0 || job.salaryMax > 0) {
      if (job.salaryMin >= 1000000) return 1.0;
      if (job.salaryMin >= 500000) return 0.8;
      return 0.6;
    }
    if (job.salaryLabel) return 0.4;
    return 0.0;
  }

  remoteScore(job) {
    const loc = (job.location || '').toLowerCase();
    const type = (job.type || '').toLowerCase();
    if (loc === 'remote' || type === 'remote') return 1.0;
    if (type === 'hybrid' || loc.includes('remote')) return 0.7;
    return 0.3;
  }

  reputationScore(job) {
    const company = (job.company || '').toLowerCase().trim();
    if (REPUTABLE_COMPANIES.has(company)) return 1.0;
    for (const known of REPUTABLE_COMPANIES) {
      if (company.includes(known)) return 0.9;
    }
    if (company.length >= 3) return 0.5;
    return 0.2;
  }

  freshnessScore(job) {
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

  descriptionScore(job) {
    const desc = (job.description || '').trim();
    if (!desc) return 0.0;
    const words = desc.split(/\s+/).length;
    if (words >= 300) return 1.0;
    if (words >= 150) return 0.8;
    if (words >= 75) return 0.6;
    if (words >= 30) return 0.4;
    return 0.2;
  }

  skillScore(job) {
    const skills = job.skills || [];
    if (skills.length >= 8) return 1.0;
    if (skills.length >= 5) return 0.8;
    if (skills.length >= 3) return 0.6;
    if (skills.length >= 1) return 0.4;
    return 0.0;
  }

  verifiedScore(job) {
    if (job.featured) return 1.0;
    if (job.source === 'LinkedIn' || job.source === 'Wellfound') return 0.8;
    if (job.source === 'Career Pages') return 0.9;
    if (job.source === 'Naukri' || job.source === 'Internshala') return 0.6;
    if (job.source === 'GitHub' || job.source === 'HackerNews' || job.source === 'Dev.to') return 0.3;
    return 0.5;
  }

  simplicityScore(job) {
    if (job.externalUrl) {
      const url = job.externalUrl.toLowerCase();
      if (url.includes('linkedin') || url.includes('wellfound')) return 0.9;
      if (url.includes('naukri') || url.includes('internshala')) return 0.7;
      return 0.5;
    }
    return 0.3;
  }
}

class QualityEngine {
  constructor() {
    this.scorer = new QualityScorer();
  }

  async scoreJob(job) {
    return this.scorer.compute(job);
  }

  async scoreJobById(jobId) {
    const job = await Job.findById(jobId).lean();
    if (!job) return null;
    const result = this.scorer.compute(job);
    await Job.updateOne({ _id: jobId }, {
      $set: {
        qualityScore: result.qualityScore,
        qualityBreakdown: result.breakdown,
      }
    });
    return result;
  }

  async scoreAllJobs(options = {}) {
    const { batchSize = 200 } = options;
    const total = await Job.countDocuments({ qualityScore: { $exists: false } });
    console.log(`[Quality] Scoring ${total} jobs without quality scores`);

    let processed = 0;
    let cursor = Job.find({ qualityScore: { $exists: false } }).batchSize(batchSize).cursor();
    let batch = [];

    for await (const job of cursor) {
      const result = this.scorer.compute(job);
      batch.push({
        updateOne: {
          filter: { _id: job._id },
          update: {
            $set: {
              qualityScore: result.qualityScore,
              qualityBreakdown: result.breakdown,
            }
          }
        }
      });
      if (batch.length >= batchSize) {
        await Job.bulkWrite(batch);
        processed += batch.length;
        console.log(`[Quality] Scored ${processed}/${total}`);
        batch = [];
      }
    }
    if (batch.length > 0) {
      await Job.bulkWrite(batch);
      processed += batch.length;
    }
    console.log(`[Quality] Complete — scored ${processed} jobs`);
    return { scored: processed };
  }

  async refreshQualityScores(options = {}) {
    const { batchSize = 200 } = options;
    const total = await Job.countDocuments();
    console.log(`[Quality] Refreshing scores for ${total} jobs`);

    let processed = 0;
    let cursor = Job.find({}).batchSize(batchSize).cursor();
    let batch = [];

    for await (const job of cursor) {
      const result = this.scorer.compute(job);
      batch.push({
        updateOne: {
          filter: { _id: job._id },
          update: {
            $set: {
              qualityScore: result.qualityScore,
              qualityBreakdown: result.breakdown,
            }
          }
        }
      });
      if (batch.length >= batchSize) {
        await Job.bulkWrite(batch);
        processed += batch.length;
        batch = [];
      }
    }
    if (batch.length > 0) {
      await Job.bulkWrite(batch);
      processed += batch.length;
    }
    console.log(`[Quality] Refresh complete`);
    return { refreshed: processed };
  }
}

module.exports = new QualityEngine();
module.exports.QualityScorer = QualityScorer;

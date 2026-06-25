const Job = require('../models/Job');
const {
  normalizeTitle, normalizeCompany, jaccardSimilarity,
  levenshteinSimilarity, ngramSimilarity, salaryOverlap,
  getEmbedding, cosineSimilarityVectors, classifyRole,
  buildTfIdfVector, getTfIdfVector, cosineSimilarity,
} = require('../services/embeddings');

const WEIGHTS = {
  titleEmbedding: 0.20,
  titleNgram: 0.10,
  descriptionTfIdf: 0.15,
  companyNormalized: 0.15,
  skillsJaccard: 0.10,
  locationSimilarity: 0.10,
  salaryOverlap: 0.10,
  roleCategory: 0.10,
};

const AUTO_MERGE_THRESHOLD = 0.95;
const FLAG_THRESHOLD = 0.80;

class DeduplicationEngine {
  constructor() {
    this.stats = { totalCompared: 0, merged: 0, flagged: 0, skipped: 0 };
  }

  async deduplicate(options = {}) {
    const {
      lookbackDays = 7,
      batchSize = 200,
      minSimilarity = 0.6,
      useEmbeddings = true,
    } = options;

    console.log(`[Dedup] Starting deduplication (lookback: ${lookbackDays}d, batch: ${batchSize}, embeddings: ${useEmbeddings})`);

    const cutoff = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);
    const totalJobs = await Job.countDocuments({ postedAt: { $gte: cutoff } });
    console.log(`[Dedup] ${totalJobs} jobs in window`);

    let cursor = Job.find({ postedAt: { $gte: cutoff } })
      .sort({ postedAt: -1 })
      .lean()
      .cursor();

    let batch = [];
    let processed = 0;

    for await (const job of cursor) {
      batch.push(job);
      if (batch.length >= batchSize) {
        await this.processBatch(batch, useEmbeddings);
        processed += batch.length;
        console.log(`[Dedup] Processed ${processed}/${totalJobs}`);
        batch = [];
      }
    }
    if (batch.length > 0) {
      await this.processBatch(batch, useEmbeddings);
      processed += batch.length;
    }

    await this.cleanStaleGroups(cutoff);

    console.log(`[Dedup] Complete — compared: ${this.stats.totalCompared}, merged: ${this.stats.merged}, flagged: ${this.stats.flagged}, skipped: ${this.stats.skipped}`);
    return { ...this.stats, totalProcessed: processed };
  }

  async processBatch(jobs, useEmbeddings) {
    const normalized = jobs.map(job => ({
      ...job,
      normTitle: normalizeTitle(job.title),
      normCompany: normalizeCompany(job.company),
      roleCat: classifyRole(job.title),
    }));

    const docTexts = normalized.map(j => `${j.title} ${j.description || ''} ${(j.skills || []).join(' ')}`);
    let tfidf;
    try {
      tfidf = buildTfIdfVector(docTexts);
    } catch {
      tfidf = null;
    }

    let embeddings = [];
    if (useEmbeddings) {
      const titles = normalized.map(j => j.title);
      embeddings = await this.batchEmbed(titles);
    }

    for (let i = 0; i < normalized.length; i++) {
      if (normalized[i].dupGroup) continue;
      for (let j = i + 1; j < normalized.length; j++) {
        if (normalized[j].dupGroup) continue;
        if (normalized[i].source === normalized[j].source && levenshteinSimilarity(normalized[i].title, normalized[j].title) > 0.95) {
          continue;
        }
        const score = this.computeConfidence(normalized[i], normalized[j], tfidf, i, j, embeddings, useEmbeddings);
      if (score >= 0.6) {
        await this.handleMatch(normalized[i], normalized[j], score);
      }
      }
    }
  }

  async computeConfidence(jobA, jobB, tfidf, idxA, idxB, embeddings, useEmbeddings) {
    let scores = {};

    if (useEmbeddings && embeddings[idxA] && embeddings[idxB]) {
      scores.titleEmbedding = cosineSimilarityVectors(embeddings[idxA], embeddings[idxB]);
    } else {
      scores.titleEmbedding = ngramSimilarity(jobA.normTitle, jobB.normTitle);
    }

    scores.titleNgram = ngramSimilarity(jobA.normTitle, jobB.normTitle);

    if (tfidf) {
      try {
        const vecA = getTfIdfVector(`${jobA.title} ${jobA.description || ''}`, tfidf, idxA);
        const vecB = getTfIdfVector(`${jobB.title} ${jobB.description || ''}`, tfidf, idxB);
        scores.descriptionTfIdf = cosineSimilarity(vecA, vecB);
      } catch {
        scores.descriptionTfIdf = ngramSimilarity(
          (jobA.description || '').substring(0, 500),
          (jobB.description || '').substring(0, 500)
        );
      }
    } else {
      scores.descriptionTfIdf = ngramSimilarity(
        (jobA.description || '').substring(0, 500),
        (jobB.description || '').substring(0, 500)
      );
    }

    scores.companyNormalized = Math.max(
      levenshteinSimilarity(jobA.normCompany, jobB.normCompany),
      ngramSimilarity(jobA.normCompany, jobB.normCompany)
    );

    const skillsA = new Set((jobA.skills || []).map(s => s.toLowerCase().trim()));
    const skillsB = new Set((jobB.skills || []).map(s => s.toLowerCase().trim()));
    scores.skillsJaccard = jaccardSimilarity(skillsA, skillsB);

    scores.locationSimilarity = this.locationSimilarity(jobA.location, jobB.location);

    scores.salaryOverlap = salaryOverlap(
      jobA.salaryMin, jobA.salaryMax,
      jobB.salaryMin, jobB.salaryMax
    );

    scores.roleCategory = jobA.roleCat === jobB.roleCat ? 1.0 : 0.0;

    let totalWeight = 0;
    let weightedSum = 0;
    for (const [key, weight] of Object.entries(WEIGHTS)) {
      if (scores[key] !== undefined) {
        weightedSum += scores[key] * weight;
        totalWeight += weight;
      }
    }
    if (totalWeight === 0) return 0;

    const baseScore = weightedSum / totalWeight;

    const bothRemote = (jobA.location || '').toLowerCase() === 'remote' && (jobB.location || '').toLowerCase() === 'remote';
    const boost = bothRemote ? 0.03 : 0;
    const sameSourcePenalty = jobA.source === jobB.source ? -0.05 : 0;

    let confidence = Math.min(1, Math.max(0, baseScore + boost + sameSourcePenalty));

    if (jobA.dupGroup && jobA.dupGroup === jobB.dupGroup) confidence = Math.max(confidence, 0.96);

    return Math.round(confidence * 100) / 100;
  }

  async handleMatch(jobA, jobB, confidence) {
    this.stats.totalCompared++;
    if (confidence >= AUTO_MERGE_THRESHOLD) {
      await this.mergeJobs(jobA, jobB);
      this.stats.merged++;
    } else if (confidence >= FLAG_THRESHOLD) {
      await this.flagJobs(jobA, jobB, confidence);
      this.stats.flagged++;
    } else {
      this.stats.skipped++;
    }
  }

  async mergeJobs(jobA, jobB) {
    const [primary, duplicate] = [jobA, jobB].sort((a, b) => {
      const aScore = (a.description || '').length + (a.skills || []).length * 10;
      const bScore = (b.description || '').length + (b.skills || []).length * 10;
      return bScore - aScore;
    });

    const groupId = primary.dupGroup || `dup-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    if (!primary.dupGroup) {
      await Job.updateOne({ _id: primary._id }, { $set: { dupGroup: groupId } });
    }
    await Job.updateOne({ _id: duplicate._id }, { $set: { dupGroup: groupId } });

    const merged = await this.mergeFields(primary, duplicate);
    await Job.updateOne({ _id: primary._id }, { $set: merged });

    console.log(`  [Merge] ${primary.title} @ ${primary.company} ← ${duplicate.title} @ ${duplicate.company} (group: ${groupId})`);
  }

  async flagJobs(jobA, jobB, confidence) {
    const groupId = `flagged-${Date.now()}`;
    await Job.updateOne({ _id: jobA._id }, { $set: { dupGroup: groupId, dupFlagged: true, dupConfidence: confidence } });
    await Job.updateOne({ _id: jobB._id }, { $set: { dupGroup: groupId, dupFlagged: true, dupConfidence: confidence } });
    console.log(`  [Flag] ${confidence * 100}% — ${jobA.title} @ ${jobA.company} vs ${jobB.title} @ ${jobB.company}`);
  }

  async mergeFields(primary, duplicate) {
    const merged = {};
    if (!primary.description && duplicate.description) merged.description = duplicate.description;
    if (!primary.salaryMin && duplicate.salaryMin) {
      merged.salaryMin = duplicate.salaryMin;
      merged.salaryMax = duplicate.salaryMax;
      merged.salaryLabel = duplicate.salaryLabel;
    }
    const existingSkills = new Set((primary.skills || []).map(s => s.toLowerCase()));
    const newSkills = (duplicate.skills || []).filter(s => !existingSkills.has(s.toLowerCase()));
    if (newSkills.length > 0) {
      merged.$push = { skills: { $each: newSkills } };
    }
    merged.dupMergedFrom = duplicate.source;
    merged.dupConfidence = Math.round(
      ((primary.dupConfidence || 0) + (duplicate.dupConfidence || 0)) / 2 * 100
    ) / 100;
    return merged;
  }

  async cleanStaleGroups(cutoff) {
    const result = await Job.updateMany(
      { postedAt: { $lt: cutoff }, dupGroup: { $ne: null } },
      { $set: { dupGroup: null, dupFlagged: false, dupConfidence: null, dupMergedFrom: null } }
    );
    if (result.modifiedCount > 0) {
      console.log(`[Dedup] Cleaned ${result.modifiedCount} stale group assignments`);
    }
  }

  locationSimilarity(locA, locB) {
    if (!locA || !locB) return locA === locB ? 1 : 0.5;
    const a = locA.toLowerCase().trim();
    const b = locB.toLowerCase().trim();
    if (a === b) return 1;
    if (a === 'remote' && b === 'remote') return 1;
    if (a.includes(b) || b.includes(a)) return 0.85;
    return ngramSimilarity(a, b);
  }

  async batchEmbed(titles) {
    const results = [];
    for (const title of titles) {
      try {
        const emb = await getEmbedding(title);
        results.push(emb);
      } catch {
        results.push(null);
      }
    }
    return results;
  }
}

module.exports = new DeduplicationEngine();

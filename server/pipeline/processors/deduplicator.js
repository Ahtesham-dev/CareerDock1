const crypto = require('crypto');
const { PipelineJob } = require('../models');
const PipelineLogger = require('../monitoring/logger');

class DeduplicationEngine {
  constructor() {
    this.logger = new PipelineLogger({ source: 'processor:dedup' });
    this.stats = { exact: 0, url: 0, fuzzy: 0, hash: 0, total: 0 };
  }

  async deduplicate(jobs, options = {}) {
    const {
      lookbackDays = 30,
      fuzzyThreshold = 0.9,
      checkExisting = true
    } = options;

    this.logger.info(`Deduplicating ${jobs.length} incoming jobs`);
    const results = { keep: [], duplicates: [], stats: { exact: 0, url: 0, hash: 0, fuzzy: 0 } };

    if (checkExisting) {
      const existingJobs = await this._loadExistingJobs(lookbackDays);
      const hashIndex = this._buildHashIndex(existingJobs);
      const urlIndex = this._buildUrlIndex(existingJobs);

      for (const job of jobs) {
        const dupResult = this._checkDuplicates(job, hashIndex, urlIndex, existingJobs, fuzzyThreshold);

        if (dupResult.isDuplicate) {
          results.duplicates.push({ job, reason: dupResult.reason, match: dupResult.match });
          results.stats[dupResult.reason]++;
          this.stats[dupResult.reason]++;
        } else {
          results.keep.push(job);
        }
      }
    } else {
      results.keep = jobs;
    }

    const internalDups = this._deduplicateInternal(results.keep, fuzzyThreshold);
    results.keep = internalDups.keep;
    results.duplicates.push(...internalDups.duplicates);
    results.stats.fuzzy += internalDups.stats.fuzzy;

    this.stats.total += results.duplicates.length;
    this.logger.info(`Dedup complete: ${results.keep.length} kept, ${results.duplicates.length} duplicates removed`);

    return results;
  }

  async _loadExistingJobs(lookbackDays) {
    const cutoff = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);
    return PipelineJob.find({
      active: true,
      $or: [
        { postedAt: { $gte: cutoff } },
        { lastSeenAt: { $gte: cutoff } }
      ]
    }).lean().limit(50000);
  }

  _buildHashIndex(existingJobs) {
    const index = new Map();
    for (const job of existingJobs) {
      if (job.hash) index.set(job.hash, job);
    }
    return index;
  }

  _buildUrlIndex(existingJobs) {
    const index = new Map();
    for (const job of existingJobs) {
      if (job.applyUrl) {
        const normalized = this._normalizeUrl(job.applyUrl);
        index.set(normalized, job);
      }
    }
    return index;
  }

  _checkDuplicates(job, hashIndex, urlIndex, existingJobs, fuzzyThreshold) {
    if (job.hash && hashIndex.has(job.hash)) {
      return { isDuplicate: true, reason: 'hash', match: hashIndex.get(job.hash) };
    }

    const normalizedUrl = this._normalizeUrl(job.applyUrl || '');
    if (normalizedUrl && urlIndex.has(normalizedUrl)) {
      return { isDuplicate: true, reason: 'url', match: urlIndex.get(normalizedUrl) };
    }

    const exactDup = this._findExactDuplicate(job, existingJobs);
    if (exactDup) {
      return { isDuplicate: true, reason: 'exact', match: exactDup };
    }

    const fuzzyDup = this._findFuzzyDuplicate(job, existingJobs, fuzzyThreshold);
    if (fuzzyDup) {
      return { isDuplicate: true, reason: 'fuzzy', match: fuzzyDup.match, confidence: fuzzyDup.confidence };
    }

    return { isDuplicate: false };
  }

  _findExactDuplicate(job, existingJobs) {
    const title = (job.title || '').toLowerCase().trim();
    const company = (job.company || '').toLowerCase().trim();
    const location = (job.location || '').toLowerCase().trim();

    for (const existing of existingJobs) {
      if (existing.source === job.source && existing.sourceJobId === job.sourceJobId && job.sourceJobId) {
        return existing;
      }
      if (existing.title?.toLowerCase().trim() === title &&
          existing.company?.toLowerCase().trim() === company &&
          existing.location?.toLowerCase().trim() === location &&
          existing.source === job.source) {
        return existing;
      }
    }
    return null;
  }

  _findFuzzyDuplicate(job, existingJobs, threshold) {
    const titleNorm = this._normalizeForComparison(job.title);
    const companyNorm = this._normalizeForComparison(job.company);
    const best = { match: null, confidence: 0 };

    for (const existing of existingJobs) {
      const existingTitle = this._normalizeForComparison(existing.title);
      const existingCompany = this._normalizeForComparison(existing.company);

      const titleSim = this._jaroWinkler(titleNorm, existingTitle);
      const companySim = this._jaroWinkler(companyNorm, existingCompany);

      const combinedSim = titleSim * 0.6 + companySim * 0.4;
      if (combinedSim > best.confidence && combinedSim >= threshold) {
        best.match = existing;
        best.confidence = Math.round(combinedSim * 100) / 100;
      }
    }

    return best.match ? best : null;
  }

  _deduplicateInternal(jobs, threshold) {
    const duplicates = [];
    const keep = [];
    const stats = { fuzzy: 0 };

    for (let i = 0; i < jobs.length; i++) {
      let isDup = false;
      const jobA = jobs[i];
      const aTitle = this._normalizeForComparison(jobA.title);
      const aCompany = this._normalizeForComparison(jobA.company);

      for (let j = i + 1; j < jobs.length; j++) {
        const jobB = jobs[j];
        const bTitle = this._normalizeForComparison(jobB.title);
        const bCompany = this._normalizeForComparison(jobB.company);
        const bLoc = this._normalizeForComparison(jobB.location);

        if (aTitle === bTitle && aCompany === bCompany) {
          isDup = true;
          duplicates.push({ job: jobB, reason: 'internal-exact', match: jobA });
          stats.fuzzy++;
          break;
        }

        const titleSim = this._jaroWinkler(aTitle, bTitle);
        const companySim = this._jaroWinkler(aCompany, bCompany);
        if (titleSim >= threshold && companySim >= threshold) {
          isDup = true;
          duplicates.push({ job: jobB, reason: 'internal-fuzzy', match: jobA, confidence: titleSim });
          stats.fuzzy++;
          break;
        }
      }

      if (!isDup) keep.push(jobA);
    }

    return { keep, duplicates, stats };
  }

  _normalizeForComparison(str) {
    return (str || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  _normalizeUrl(url) {
    if (!url) return '';
    try {
      const parsed = new URL(url);
      const cleanParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', 'ref', 'source', 'si'];
      for (const param of cleanParams) parsed.searchParams.delete(param);
      return parsed.origin + parsed.pathname.replace(/\/+$/, '') + (parsed.search ? parsed.search : '');
    } catch {
      return url.startsWith('http') ? url.replace(/\/+$/, '') : '';
    }
  }

  _jaroWinkler(s1, s2) {
    if (s1 === s2) return 1.0;
    if (s1.length === 0 || s2.length === 0) return 0.0;

    const matchDistance = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
    const s1Matches = new Array(s1.length).fill(false);
    const s2Matches = new Array(s2.length).fill(false);
    let matches = 0;
    let transpositions = 0;

    for (let i = 0; i < s1.length; i++) {
      const start = Math.max(0, i - matchDistance);
      const end = Math.min(i + matchDistance + 1, s2.length);
      for (let j = start; j < end; j++) {
        if (s2Matches[j]) continue;
        if (s1[i] !== s2[j]) continue;
        s1Matches[i] = true;
        s2Matches[j] = true;
        matches++;
        break;
      }
    }

    if (matches === 0) return 0.0;

    let k = 0;
    for (let i = 0; i < s1.length; i++) {
      if (!s1Matches[i]) continue;
      while (!s2Matches[k]) k++;
      if (s1[i] !== s2[k]) transpositions++;
      k++;
    }

    const jaro = ((matches / s1.length) + (matches / s2.length) + ((matches - transpositions / 2) / matches)) / 3;

    let prefix = 0;
    const maxPrefix = Math.min(4, s1.length, s2.length);
    for (let i = 0; i < maxPrefix; i++) {
      if (s1[i] === s2[i]) prefix++;
      else break;
    }

    return jaro + prefix * 0.1 * (1 - jaro);
  }

  getStats() {
    return { ...this.stats };
  }
}

module.exports = new DeduplicationEngine();

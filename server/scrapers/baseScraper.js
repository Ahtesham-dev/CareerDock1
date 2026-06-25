const crypto = require('crypto');
const ScraperRun = require('../models/ScraperRun');

class BaseScraper {
  constructor(sourceName) {
    this.source = sourceName;
  }

  async fetchJobs() {
    throw new Error('fetchJobs() must be implemented by subclass');
  }

  async run() {
    const run = await ScraperRun.create({ source: this.source });
    const start = Date.now();
    try {
      const raw = await this._retry(() => this.fetchJobs());
      const jobs = raw.map(j => this.normalise(j)).filter(Boolean);
      run.jobsFound = raw.length;
      run.jobsSaved = jobs.length;
      run.status = 'success';
      run.duration = Date.now() - start;
      run.completedAt = new Date();
      await run.save();
      return jobs;
    } catch (err) {
      run.status = 'failed';
      run.duration = Date.now() - start;
      run.completedAt = new Date();
      run.error = err.message;
      run.errorStack = err.stack;
      await run.save();
      throw err;
    }
  }

  async _retry(fn, retries = 3, baseDelay = 1000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        if (attempt === retries) throw err;
        const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 500;
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  _buildSearchText(job) {
    return [
      job.title || '',
      job.company || '',
      ...(Array.isArray(job.skills) ? job.skills : []),
      job.location || ''
    ].filter(Boolean).join(' ').toLowerCase().trim();
  }

  normalise(raw) {
    const hash = crypto.createHash('sha256').update([
      (raw.title || '').toLowerCase().trim(),
      (raw.title || '').toLowerCase().trim() !== 'Unknown Position' ? (raw.company || '').toLowerCase().trim() : '',
      (raw.location || 'Remote').toLowerCase().trim()
    ].join('|||')).digest('hex');
    const job = {
      title: raw.title || 'Unknown Position',
      company: raw.company || 'Unknown Company',
      location: raw.location || 'Remote',
      type: this._parseType(raw.type || raw.location || ''),
      experience: this._parseExp(raw.title || ''),
      salaryMin: raw.salaryMin || 0,
      salaryMax: raw.salaryMax || 0,
      salaryLabel: this._buildSalaryLabel(raw.salaryMin, raw.salaryMax),
      source: this.source,
      skills: raw.skills || [],
      applied: 0,
      featured: false,
      dupGroup: raw.dupGroup || null,
      postedAt: raw.postedAt || new Date(),
      externalUrl: raw.externalUrl || '',
      applyUrl: raw.applyUrl || raw.externalUrl || '',
      description: raw.description || '',
      hash,
      active: true,
      lastSeenAt: new Date(),
      searchText: this._buildSearchText(raw)
    };
    return job;
  }

  _parseType(str) {
    const s = (str || '').toLowerCase();
    if (s.includes('remote') || s.includes('work from home') || s.includes('wfh')) return 'Remote';
    if (s.includes('hybrid')) return 'Hybrid';
    return 'Full-time';
  }

  _parseExp(str) {
    const s = (str || '').toLowerCase();
    if (s.includes('senior') || s.includes('lead') || s.includes('principal') || s.includes('architect') || s.includes('staff')) return 'Senior';
    if (s.includes('fresher') || s.includes('entry') || s.includes('junior') || s.includes('trainee') || s.includes('intern')) return 'Fresher';
    return 'Mid-level';
  }

  _buildSalaryLabel(min, max) {
    if (!min && !max) return '';
    const fmt = (v) => {
      if (!v) return '';
      const lakhs = v / 100000;
      if (lakhs >= 1) return `\u20B9${lakhs}L`;
      return `\u20B9${Math.round(v / 10000)}K`;
    };
    if (min && max) return `${fmt(min)}-${fmt(max).replace(/^\u20B9/, '')}`;
    if (min) return `${fmt(min)}+`;
    if (max) return `Up to ${fmt(max)}`;
    return '';
  }
}

module.exports = BaseScraper;

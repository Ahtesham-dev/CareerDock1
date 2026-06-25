const crypto = require('crypto');

class BaseAdapter {
  constructor(sourceName) {
    this.source = sourceName;
    this.logger = console;
  }

  async discover() { return []; }

  async fetchJobs(context) {
    throw new Error(`${this.source} must implement fetchJobs()`);
  }

  normalize(raw) {
    const hash = crypto.createHash('sha256').update([
      (raw.title || '').toLowerCase().trim(),
      (raw.company || '').toLowerCase().trim(),
      (raw.location || 'Remote').toLowerCase().trim()
    ].join('|||')).digest('hex');

    return {
      title: raw.title || 'Unknown Position',
      company: raw.company || 'Unknown Company',
      location: raw.location || 'Remote',
      remote: raw.remote || false,
      salaryMin: raw.salaryMin || 0,
      salaryMax: raw.salaryMax || 0,
      skills: raw.skills || [],
      description: raw.description || '',
      applyUrl: raw.applyUrl || raw.externalUrl || '',
      source: this.source,
      sourceJobId: raw.sourceJobId || '',
      postedAt: raw.postedAt ? new Date(raw.postedAt) : new Date(),
      hash,
      active: true,
      lastSeenAt: new Date()
    };
  }

  async run(context) {
    const start = Date.now();
    try {
      const raw = await this.fetchJobs(context);
      const jobs = raw.map(j => this.normalize(j)).filter(Boolean);
      return { success: true, jobs, found: raw.length, saved: jobs.length, duration: Date.now() - start };
    } catch (err) {
      return { success: false, jobs: [], found: 0, saved: 0, duration: Date.now() - start, error: err.message };
    }
  }
}

module.exports = BaseAdapter;

const BaseAdapter = require('../base/BaseAdapter');
const RateLimiter = require('../../../../pipeline/queue/rateLimiter');

class PeerlistAdapter extends BaseAdapter {
  constructor() {
    super('Peerlist');
    this.rateLimiter = new RateLimiter({ requestsPerSecond: 3, burstSize: 5 });
  }

  async fetchJobs(context = {}) {
    const { maxPages = 10 } = context;
    return this._fetchFromApi(maxPages);
  }

  async _fetchFromApi(maxPages) {
    const jobz = [];
    for (let page = 0; page < maxPages; page++) {
      try {
        await this.rateLimiter.acquire();
        const data = await this._fetchRest(page);
        if (!data || data.length === 0) break;
        jobz.push(...data.map(j => this._normalize(j)));
      } catch (err) {
        console.warn(`[PeerlistAdapter] Page ${page} failed: ${err.message}`);
        break;
      }
    }
    return jobz;
  }

  async _fetchRest(page) {
    try {
      const axios = require('axios');
      const { data } = await axios.get('https://api.peerlist.io/api/v1/jobs', {
        params: { limit: 50, offset: page * 50 },
        timeout: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      return data.jobs || data.data || data.results || [];
    } catch {
      return [];
    }
  }

  _normalize(raw) {
    const companyName = typeof raw.company === 'object' ? (raw.company?.name || '') : (raw.company || '');
    return {
      title: raw.title || raw.position || '',
      company: companyName,
      location: raw.location || 'Remote',
      remote: (raw.location || '').toLowerCase().includes('remote') || raw.remote || false,
      salaryMin: raw.salaryMin || raw.minSalary || raw.salary?.min || 0,
      salaryMax: raw.salaryMax || raw.maxSalary || raw.salary?.max || 0,
      skills: Array.isArray(raw.skills) ? raw.skills.map(s => typeof s === 'string' ? s : s.name || '') : [],
      description: raw.description || raw.body || '',
      applyUrl: raw.applyUrl || raw.url || raw.apply_link || '',
      sourceJobId: raw.id ? `pl-${raw.id}` : '',
      postedAt: raw.postedAt || raw.createdAt || raw.posted_date ? new Date(raw.postedAt || raw.createdAt || raw.posted_date) : new Date(),
      tags: raw.tags || [],
      logo: typeof raw.company === 'object' ? (raw.company?.logo || '') : (raw.logo || '')
    };
  }
}

module.exports = PeerlistAdapter;

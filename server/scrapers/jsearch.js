const axios = require('axios');
const BaseScraper = require('./baseScraper');

class JSearchScraper extends BaseScraper {
  constructor() {
    super('JSearch');
  }

  async fetchJobs() {
    const { data } = await axios.get('https://remoteok.io/api', { timeout: 15000 });
    return (data || []).slice(1).filter(j => j.position).slice(0, 50).map(job => ({
      title: job.position || '',
      company: job.company || '',
      location: job.location || 'Remote',
      skills: (job.tags || []).map(t => t.toLowerCase()),
      salaryMin: 0,
      salaryMax: 0,
      postedAt: job.date ? new Date(job.date) : new Date(),
      externalUrl: job.url || '',
      applyUrl: job.url || '',
      description: job.description || ''
    }));
  }
}

module.exports = JSearchScraper;

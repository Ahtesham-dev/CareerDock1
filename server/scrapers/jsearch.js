const axios = require('axios');
const BaseScraper = require('./baseScraper');

class JSearchScraper extends BaseScraper {
  constructor() {
    super('JSearch');
  }

  async fetchJobs() {
    const { data } = await axios.get('https://remoteok.io/api', { timeout: 15000 });
    return (data || []).slice(0, 50).map(job => ({
      title: job.position || '',
      company: job.company || '',
      location: job.location || 'Remote',
      skills: (job.tags || []).map(t => t.toLowerCase()),
      salaryMin: null,
      salaryMax: null,
      postedAt: job.date ? new Date(job.date) : new Date(),
      externalUrl: job.url || '',
      description: job.description || ''
    }));
  }
}

module.exports = JSearchScraper;

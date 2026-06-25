const axios = require('axios');
const BaseScraper = require('./baseScraper');

const SEARCH_QUERIES = (process.env.LINKEDIN_SEARCH_QUERIES || 'React Developer,Node.js Developer,Frontend Engineer,Full Stack Developer,Software Developer,Backend Developer,Data Engineer,DevOps Engineer').split(',');

class LinkedInScraper extends BaseScraper {
  constructor() {
    super('LinkedIn');
  }

  async fetchJobs() {
    const token = process.env.LINKEDIN_ACCESS_TOKEN;
    if (!token) return [];
    const jobs = [];
    for (const query of SEARCH_QUERIES) {
      try {
        const { data } = await axios.get('https://api.linkedin.com/v2/jobSearch', {
          params: { q: query.trim(), location: process.env.LINKEDIN_SEARCH_LOCATIONS || 'India', count: 10 },
          headers: { Authorization: `Bearer ${token}` },
          timeout: 15000
        });
        (data?.elements || []).forEach(el => {
          const job = el?.jobPosting || el;
          jobs.push({
            title: job.title || job.description?.text || '',
            company: job.companyDetails?.company?.name || job.companyName || '',
            location: job.locationDescription || job.location || 'India',
            skills: (job.skills || []).map(s => typeof s === 'string' ? s : s.name).filter(Boolean),
            externalUrl: job.applyUrl || job.url || '',
            description: (job.description?.text || '').slice(0, 500),
            postedAt: job.publishedAt ? new Date(job.publishedAt) : new Date()
          });
        });
      } catch (err) {
        console.warn(`[LinkedIn] Failed to fetch query "${query}": ${err.message}`);
      }
      await new Promise(r => setTimeout(r, 1000));
    }
    return jobs;
  }
}

module.exports = LinkedInScraper;

const axios = require('axios');
const BaseScraper = require('./baseScraper');

const TAGS = ['job', 'hiring', 'jobs', 'careers', 'recruitment', 'remote'];

class DevToScraper extends BaseScraper {
  constructor() {
    super('Dev.to');
  }

  async fetchJobs() {
    const jobs = [];
    for (const tag of TAGS) {
      try {
        const { data } = await axios.get('https://dev.to/api/articles', {
          params: { tag, per_page: 25, state: 'published' },
          timeout: 10000
        });
        (data || []).forEach(article => {
          const titleParts = (article.title || '').split('-');
          const company = titleParts.length > 1 ? titleParts.pop().trim() : article.user?.username || '';
          jobs.push({
            title: article.title || '',
            company,
            location: (article.tags || []).includes('remote') ? 'Remote' : 'Remote',
            skills: article.tag_list || [],
            externalUrl: article.url || '',
            description: article.description || '',
            postedAt: article.published_at ? new Date(article.published_at) : new Date()
          });
        });
      } catch (err) {
        console.warn(`[DevTo] Failed to fetch tag "${tag}": ${err.message}`);
      }
    }
    return jobs;
  }
}

module.exports = DevToScraper;

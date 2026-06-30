const axios = require('axios');
const BaseScraper = require('./baseScraper');

const TAGS = ['hiring', 'job'];

const HIRING_PATTERN = /^(.+?)\s+(?:is|are|we'?re?)\s+(?:hiring|looking\s+for|seeking)\s+/i;
const HIRING_SUFFIX = /\s+(?:is|are|we'?re?)\s+(?:hiring|looking\s+for|seeking)\s+/i;

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
          const title = (article.title || '').trim();
          if (!HIRING_SUFFIX.test(title)) return;

          const match = title.match(HIRING_PATTERN);
          if (!match) return;

          const company = match[1].trim();
          const jobTitle = title.replace(HIRING_SUFFIX, ' ').replace(company + ' ', '').replace(/^(a|an|the)\s+/i, '').trim();

          jobs.push({
            title: jobTitle || title,
            company,
            location: (article.tag_list || []).includes('remote') ? 'Remote' : 'Remote',
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

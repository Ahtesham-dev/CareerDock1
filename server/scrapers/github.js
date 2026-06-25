const axios = require('axios');
const BaseScraper = require('./baseScraper');

const QUERIES = [
  'machine learning engineer',
  'software engineer',
  'data scientist',
  'full stack developer',
  'devops engineer'
];

class GitHubScraper extends BaseScraper {
  constructor() {
    super('GitHub');
  }

  async fetchJobs() {
    const jobs = [];
    for (const query of QUERIES) {
      try {
        const { data } = await axios.get('https://api.github.com/search/repositories', {
          params: { q: `${query} in:readme markdown stars:>10`, sort: 'stars', per_page: 5 },
          timeout: 10000
        });
        (data.items || []).forEach(repo => {
          jobs.push({
            title: `Developer - ${query}`,
            company: repo.owner?.login || 'GitHub',
            location: 'Remote',
            skills: [query, repo.language].filter(Boolean),
            externalUrl: repo.html_url,
            description: repo.description || '',
            postedAt: repo.created_at ? new Date(repo.created_at) : new Date()
          });
        });
      } catch (err) {
        console.warn(`[GitHub] Failed to fetch query "${query}": ${err.message}`);
      }
    }
    return jobs;
  }
}

module.exports = GitHubScraper;

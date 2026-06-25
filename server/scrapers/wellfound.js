const axios = require('axios');
const BaseScraper = require('./baseScraper');

const WELLFOUND_KEYWORDS = [
  'software engineer', 'frontend', 'backend', 'full stack',
  'data scientist', 'product manager', 'designer', 'devops',
  'machine learning', 'mobile', 'developer', 'sde'
];

const PAGE_SIZE = 30;

class WellfoundScraper extends BaseScraper {
  constructor() {
    super('Wellfound');
  }

  async fetchJobs() {
    const allJobs = [];
    const seen = new Set();

    for (const keyword of WELLFOUND_KEYWORDS) {
      const jobs = await this._fetchKeyword(keyword, seen);
      allJobs.push(...jobs);
      await new Promise(r => setTimeout(r, 500 + Math.random() * 1000));
    }

    return allJobs;
  }

  async _fetchKeyword(keyword, seen) {
    const jobs = [];
    let cursor = null;
    let hasMore = true;
    let page = 0;

    while (hasMore && page < 5) {
      try {
        const { data } = await axios.post('https://wellfound.com/graphql', {
          query: `query JobSearch($query: String!, $after: String, $first: Int) {
            jobSearch(query: $query, locationSlug: "", after: $after, first: $first) {
              edges { cursor node { id title startup { name slug } locations { text } compensation { maxValue } remote jobType { name } } }
              pageInfo { hasNextPage endCursor }
            }
          }`,
          variables: { query: keyword, after: cursor, first: PAGE_SIZE }
        }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000
        });

        const search = data?.data?.jobSearch;
        const edges = search?.edges || [];
        const pageInfo = search?.pageInfo || {};

        for (const e of edges) {
          const node = e.node;
          const dedupKey = `${node.title}|${node.startup?.name || ''}`;
          if (seen.has(dedupKey)) continue;
          seen.add(dedupKey);

          const comp = node.compensation?.maxValue;
          jobs.push({
            title: node.title || '',
            company: node.startup?.name || '',
            location: node.locations?.[0]?.text || 'Remote',
            type: node.remote ? 'Remote' : (node.jobType?.name || 'Full-time'),
            salaryMin: 0,
            salaryMax: comp || 0,
            skills: (node.title || '').toLowerCase().split(/\s+/).filter(s => ['react','node','python','go','rust','aws','ml','ai','typescript','docker','kubernetes'].includes(s)),
            postedAt: new Date(),
            externalUrl: `https://wellfound.com/company/${node.startup?.slug || node.startup?.name?.toLowerCase().replace(/\s+/g, '-') || ''}`
          });
        }

        hasMore = pageInfo.hasNextPage && edges.length >= PAGE_SIZE;
        cursor = pageInfo.endCursor || null;
        page++;
      } catch (err) {
        this.logError(`Wellfound keyword "${keyword}" page ${page + 1} failed: ${err.message}`);
        hasMore = false;
      }
    }

    return jobs;
  }
}

module.exports = WellfoundScraper;

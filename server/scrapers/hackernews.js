const axios = require('axios');
const BaseScraper = require('./baseScraper');

const SKILL_KEYWORDS = [
  'react', 'node', 'python', 'javascript', 'typescript', 'go', 'rust',
  'aws', 'docker', 'kubernetes', 'machine learning', 'data science',
  'frontend', 'backend', 'full stack', 'devops', 'sre', 'mobile'
];

class HackerNewsScraper extends BaseScraper {
  constructor() {
    super('HackerNews');
  }

  async fetchJobs() {
    try {
      const { data } = await axios.get('https://hn.algolia.com/api/v1/search', {
        params: { query: 'Who is hiring', tags: 'story', hitsPerPage: 5 },
        timeout: 10000
      });
      if (!data.hits?.length) return [];
      const story = data.hits[0];
      const { data: comments } = await axios.get(`https://hn.algolia.com/api/v1/items/${story.objectID}`, { timeout: 10000 });
      return (comments.children || []).slice(0, 30).filter(c => {
        const t = (c.text || '').toLowerCase();
        return t.includes('hiring') || t.includes('role') || t.includes('position');
      }).map(c => {
        const text = c.text || '';
        const firstLine = text.split('\n')[0] || text;
        const company = firstLine.replace(/^(points|apply|hiring)[:\s]*/i, '').trim().split('|')[0].trim();
        const locationMatch = text.match(/(remote|bangalore|mumbai|delhi|pune|hyderabad|chennai|india)/i);
        const skills = SKILL_KEYWORDS.filter(s => text.toLowerCase().includes(s));
        return {
          title: firstLine.slice(0, 80),
          company: company || 'Startup',
          location: locationMatch ? locationMatch[0] : 'Remote',
          skills,
          externalUrl: story.url || `https://news.ycombinator.com/item?id=${c.id}`,
          description: text.slice(0, 500),
          postedAt: new Date(story.created_at)
        };
      });
    } catch {
      return [];
    }
  }
}

module.exports = HackerNewsScraper;

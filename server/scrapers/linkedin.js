const axios = require('axios');
const cheerio = require('cheerio');
const BaseScraper = require('./baseScraper');

const SEARCH_QUERIES = (process.env.LINKEDIN_SEARCH_QUERIES || 'React Developer,Node.js Developer,Frontend Engineer,Full Stack Developer,Software Developer,Backend Developer,Data Engineer,DevOps Engineer').split(',');

class LinkedInScraper extends BaseScraper {
  constructor() {
    super('LinkedIn');
  }

  async fetchJobs() {
    const jobs = [];
    const seen = new Set();
    for (const query of SEARCH_QUERIES) {
      for (let page = 0; page < 2; page++) {
        try {
          const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search`;
          const { data } = await axios.get(url, {
            params: { keywords: query.trim(), location: process.env.LINKEDIN_SEARCH_LOCATIONS || 'India', start: page * 25 },
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36' },
            timeout: 15000
          });
          const $ = cheerio.load(data);
          $('.base-card').each((_, el) => {
            const title = $(el).find('.base-search-card__title').text().trim();
            const company = $(el).find('.base-search-card__subtitle a').text().trim();
            const location = $(el).find('.job-search-card__location').text().trim();
            const link = $(el).find('a.base-card__full-link').attr('href') || '';
            if (!title || !company) return;
            const dedupKey = `${title}|${company}|${location}`;
            if (seen.has(dedupKey)) return;
            seen.add(dedupKey);
            jobs.push({
              title, company, location: location || 'India',
              externalUrl: link, skills: [],
              description: '', postedAt: new Date()
            });
          });
        } catch (err) {
          console.warn(`[LinkedIn] Failed query "${query}" page ${page + 1}: ${err.message}`);
        }
        await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));
      }
    }
    return jobs;
  }
}

module.exports = LinkedInScraper;

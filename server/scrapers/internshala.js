const axios = require('axios');
const cheerio = require('cheerio');
const BaseScraper = require('./baseScraper');

const URLS = [
  'https://internshala.com/jobs/work-from-home-jobs',
  'https://internshala.com/jobs/fresher-jobs',
  'https://internshala.com/jobs/software-developer-jobs'
];

const TECH_ROLES = ['engineer', 'developer', 'frontend', 'backend', 'full stack', 'react', 'node', 'python', 'data', 'devops', 'software'];

class InternshalaScraper extends BaseScraper {
  constructor() {
    super('Internshala');
  }

  async fetchJobs() {
    const jobs = [];
    for (const url of URLS) {
      try {
        const { data } = await axios.get(url, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          timeout: 15000
        });
        const $ = cheerio.load(data);
        $('.individual_internship').each((_, el) => {
          const title = $(el).find('.job-internship-name a').text().trim();
          const company = $(el).find('.company-name').text().trim();
          const location = $(el).find('.row-1-item.locations a').first().text().trim();
          if (!title || !company) return;
          const isTech = TECH_ROLES.some(r => title.toLowerCase().includes(r));
          if (!isTech) return;
          const cardText = $(el).text();
          const salaryMatch = cardText.match(/\u20B9\s?[\d,]+\s?\/\s?month/i);
          const isRemote = cardText.toLowerCase().includes('work from home');
          jobs.push({
            title, company,
            location: isRemote ? 'Remote' : (location || 'India'),
            salaryMin: salaryMatch ? parseInt(salaryMatch[0].replace(/[^\d]/g, '')) * 12 : 0,
            salaryMax: 0,
            skills: title.toLowerCase().split(' '),
            postedAt: new Date(),
            externalUrl: `https://internshala.com${$(el).find('a').first().attr('href') || ''}`
          });
        });
      } catch (err) {
        console.warn(`[Internshala] Failed to fetch ${url}: ${err.message}`);
      }
    }
    return jobs;
  }
}

module.exports = InternshalaScraper;

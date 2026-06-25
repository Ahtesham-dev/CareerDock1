const axios = require('axios');
const cheerio = require('cheerio');
const BaseScraper = require('./baseScraper');

const COMPANY_CONFIGS = [
  { company: 'Razorpay', url: 'https://razorpay.com/jobs/', selector: { list: '.jobs-list li', title: 'h3', location: '.location', link: 'a' } },
  { company: 'Swiggy', url: 'https://careers.swiggy.com/', selector: { list: '.job-listing', title: '.job-title', location: '.job-location', link: 'a' } },
  { company: 'Zepto', url: 'https://zeptonow.com/careers', selector: { list: '.careers-list li', title: 'h4', location: '.location', link: 'a' } },
  { company: 'CRED', url: 'https://careers.cred.club/', selector: { list: '.job-opening', title: 'h5', location: '.location', link: 'a' } },
  { company: 'BrowserStack', url: 'https://www.browserstack.com/careers', selector: { list: '.job-listing', title: '.job-title', location: '.job-location', link: 'a' } },
  { company: 'PhonePe', url: 'https://www.phonepe.com/careers/', selector: { list: '.job-card', title: '.job-title', location: '.job-location', link: 'a' } }
];

const TECH_KEYWORDS = ['engineer', 'developer', 'dev', 'frontend', 'backend', 'full stack', 'sde', 'software', 'data', 'devops', 'sre'];

class CareerPagesScraper extends BaseScraper {
  constructor() {
    super('Career Pages');
  }

  async fetchJobs() {
    const jobs = [];
    for (const config of COMPANY_CONFIGS) {
      try {
        const { data } = await axios.get(config.url, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          timeout: 15000
        });
        const $ = cheerio.load(data);
        $(config.selector.list).each((_, el) => {
          const title = $(el).find(config.selector.title).text().trim();
          const location = $(el).find(config.selector.location).text().trim();
          const link = $(el).find(config.selector.link).attr('href') || '';
          if (!title) return;
          const isTech = TECH_KEYWORDS.some(k => title.toLowerCase().includes(k));
          if (!isTech) return;
          jobs.push({
            title,
            company: config.company,
            location: location || 'India',
            postedAt: new Date(),
            externalUrl: link.startsWith('http') ? link : new URL(link, config.url).href
          });
        });
      } catch (err) {
        console.warn(`[CareerPages] Failed to fetch ${config.company}: ${err.message}`);
      }
      await new Promise(r => setTimeout(r, 1500));
    }
    return jobs;
  }
}

module.exports = CareerPagesScraper;

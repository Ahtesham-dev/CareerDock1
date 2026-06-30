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
    console.warn('[Wellfound] Blocked by DataDome anti-bot — returning 0 jobs');
    return [];
  }
}

module.exports = WellfoundScraper;

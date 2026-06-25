const axios = require('axios');
const cheerio = require('cheerio');
const PipelineLogger = require('../../monitoring/logger');

const KNOWN_CAREERS = [
  '/careers', '/jobs', '/career', '/join-us', '/work-with-us',
  '/about#jobs', '/about/careers', '/team#jobs', '/hiring',
  '/about-us/careers', '/company/careers', '/life-at', '/open-positions'
];

class YCDirectExtractor {
  constructor() {
    this.logger = new PipelineLogger({ source: 'yc:direct' });
  }

  async extractJobs(company) {
    const careersUrl = company.careersUrl || this._buildCareersUrl(company.website);
    if (!careersUrl) return [];

    try {
      const html = await this._fetchPage(careersUrl);
      if (!html) return [];

      const jsonLdJobs = this._extractJsonLd(html);
      if (jsonLdJobs.length > 0) {
        return jsonLdJobs.map(j => this._fromJsonLd(j, company));
      }

      const $ = cheerio.load(html);
      const jobs = this._extractFromHtml($, company, careersUrl);
      if (jobs.length > 0) return jobs;

      if (careersUrl !== company.website) return [];
      return await this._tryAlternativeUrls(company);
    } catch (err) {
      this.logger.debug(`Direct extract failed for ${company.name}: ${err.message}`);
      return [];
    }
  }

  _buildCareersUrl(website) {
    if (!website) return '';
    const domain = website.startsWith('http') ? website : `https://${website}`;
    try {
      const url = new URL(domain);
      return `${url.protocol}//${url.hostname}/careers`;
    } catch {
      return '';
    }
  }

  async _fetchPage(url) {
    try {
      const { data } = await axios.get(url, {
        timeout: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        responseType: 'text'
      });
      return data;
    } catch {
      return null;
    }
  }

  async _tryAlternativeUrls(company) {
    const website = company.website;
    if (!website) return [];
    const domain = website.startsWith('http') ? website : `https://${website}`;

    for (const path of KNOWN_CAREERS) {
      try {
        const url = `${domain.replace(/\/+$/, '')}${path}`;
        const html = await this._fetchPage(url);
        if (html) {
          const jsonLdJobs = this._extractJsonLd(html);
          if (jsonLdJobs.length > 0) {
            return jsonLdJobs.map(j => this._fromJsonLd(j, company));
          }
          const $ = cheerio.load(html);
          const jobs = this._extractFromHtml($, company, url);
          if (jobs.length > 0) return jobs;
        }
      } catch { }
    }
    return [];
  }

  _extractJsonLd(html) {
    const results = [];
    const regex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
      try {
        const data = JSON.parse(match[1]);
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          if (item['@type'] === 'JobPosting') results.push(item);
          if (item['@graph']) {
            for (const g of item['@graph']) {
              if (g['@type'] === 'JobPosting') results.push(g);
            }
          }
        }
      } catch { }
    }
    return results;
  }

  _fromJsonLd(j, company) {
    return {
      title: j.title || '',
      company: company.name,
      location: j.jobLocation?.address?.addressLocality || j.jobLocation || 'Remote',
      remote: (j.jobLocationType || '').toLowerCase().includes('remote') || false,
      description: this._cleanHtml(j.description || ''),
      applyUrl: j.url || j.directApply || '',
      source: 'YCombinator',
      sourceJobId: `yc-${j.identifier || j.id || Math.random().toString(36).substr(2, 9)}`,
      skills: this._extractSkills(j.description || ''),
      postedAt: j.datePosted ? new Date(j.datePosted) : new Date(),
      salaryMin: j.baseSalary?.value?.minValue || 0,
      salaryMax: j.baseSalary?.value?.maxValue || 0,
      currency: j.baseSalary?.currency || 'USD',
      metadata: { extraction: 'jsonld' }
    };
  }

  _extractFromHtml($, company, baseUrl) {
    const jobs = [];

    $('a[href*="job"], a[href*="career"], a[href*="position"], a[href*="opening"]').each((_, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      if (!href || !text) return;
      if (text.toLowerCase().includes('all') || text.toLowerCase().includes('view')) return;
      if (text.length > 100 || text.length < 3) return;

      const fullUrl = href.startsWith('http') ? href : new URL(href, baseUrl).href;
      jobs.push({
        title: text,
        company: company.name,
        location: 'Remote',
        remote: true,
        description: '',
        applyUrl: fullUrl,
        source: 'YCombinator',
        sourceJobId: `yc-${Buffer.from(fullUrl).toString('base64').substr(0, 32)}`,
        postedAt: new Date(),
        metadata: { extraction: 'html', careersUrl: baseUrl }
      });
    });

    $('.job-listing, .job-card, .job-post, .position, .opening').each((_, el) => {
      const title = $(el).find('h2, h3, h4, .title, .job-title').first().text().trim();
      if (!title) return;
      const link = $(el).find('a').first().attr('href') || '';
      const location = $(el).find('.location, .job-location, .meta').first().text().trim();
      const fullUrl = link.startsWith('http') ? link : link ? new URL(link, baseUrl).href : '';

      jobs.push({
        title,
        company: company.name,
        location: location || 'Remote',
        remote: location.toLowerCase().includes('remote') || false,
        description: '',
        applyUrl: fullUrl,
        source: 'YCombinator',
        sourceJobId: `yc-${Buffer.from(fullUrl || title).toString('base64').substr(0, 32)}`,
        postedAt: new Date(),
        metadata: { extraction: 'html', careersUrl: baseUrl }
      });
    });

    return jobs;
  }

  _extractSkills(content) {
    if (!content) return [];
    const skills = new Set();
    const techKeywords = [
      'javascript', 'typescript', 'python', 'java', 'golang', 'rust', 'c++', 'ruby',
      'react', 'angular', 'vue', 'node', 'express', 'django', 'flask', 'spring',
      'aws', 'gcp', 'azure', 'docker', 'kubernetes', 'terraform',
      'postgresql', 'mongodb', 'mysql', 'redis', 'elasticsearch', 'kafka',
      'graphql', 'rest', 'grpc'
    ];
    const lower = content.toLowerCase();
    for (const skill of techKeywords) {
      if (lower.includes(skill)) skills.add(skill);
    }
    return Array.from(skills).slice(0, 15);
  }

  _cleanHtml(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
  }
}

module.exports = YCDirectExtractor;

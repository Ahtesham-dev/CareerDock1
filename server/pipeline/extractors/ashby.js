const axios = require('axios');
const PipelineLogger = require('../monitoring/logger');

class AshbyExtractor {
  constructor() {
    this.logger = new PipelineLogger({ source: 'extractor:ashby' });
  }

  canHandle(url) {
    return url && url.toLowerCase().includes('ashby');
  }

  async extractJobs(companyName, careersUrl) {
    try {
      const domain = this._extractDomain(careersUrl, companyName);
      if (!domain) return [];
      return await this._fetchJobs(domain, companyName);
    } catch (err) {
      this.logger.error(`Ashby extract failed for ${companyName}: ${err.message}`);
      return [];
    }
  }

  _extractDomain(url, companyName) {
    if (!url) return companyName.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const match = url.match(/ashbyhq\.com\/([^/?#]+)/);
    if (match) return match[1];
    const domainMatch = url.match(/https?:\/\/([^.]+)\.ashbyhq\.com/);
    return domainMatch ? domainMatch[1] : companyName.toLowerCase().replace(/[^a-z0-9-]/g, '');
  }

  async _fetchJobs(domain, companyName) {
    try {
      const url = `https://api.ashbyhq.com/posting-api/job-board/${domain}`;
      const { data } = await axios.get(url, { timeout: 15000 });

      const jobs = data.jobs || data || [];
      if (Array.isArray(jobs)) {
        return jobs.map(j => ({
          title: j.title || j.name || '',
          company: companyName,
          location: j.location || j.address || 'Remote',
          remote: (j.isRemote || j.remote || '').toString().toLowerCase() === 'true' || false,
          description: this._cleanHtml(j.descriptionHtml || j.description || ''),
          applyUrl: j.applyUrl || `https://${domain}.ashbyhq.com`,
          source: 'Ashby',
          sourceJobId: `ashby-${j.id || j.externalId || Math.random().toString(36).substr(2, 9)}`,
          skills: this._extractSkills(j.descriptionHtml || j.description || ''),
          postedAt: j.publishedAt || j.createdAt ? new Date(j.publishedAt || j.createdAt) : new Date(),
          salaryMin: j.salaryMin || j.compensation?.min || 0,
          salaryMax: j.salaryMax || j.compensation?.max || 0,
          currency: j.compensation?.currency || 'USD',
          metadata: { department: j.department || '' }
        }));
      }
      return [];
    } catch (err) {
      this.logger.error(`Ashby fetch failed for ${domain}: ${err.message}`);
      return [];
    }
  }

  _extractSkills(content) {
    if (!content) return [];
    const skills = new Set();
    const techKeywords = [
      'javascript', 'typescript', 'python', 'java', 'golang', 'react', 'node',
      'aws', 'docker', 'kubernetes', 'postgresql', 'mongodb', 'graphql', 'rust'
    ];
    const lower = content.toLowerCase();
    for (const skill of techKeywords) {
      if (lower.includes(skill)) skills.add(skill);
    }
    return Array.from(skills).slice(0, 15);
  }

  _cleanHtml(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  }
}

module.exports = AshbyExtractor;

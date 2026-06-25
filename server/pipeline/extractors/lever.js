const axios = require('axios');
const PipelineLogger = require('../monitoring/logger');

class LeverExtractor {
  constructor() {
    this.logger = new PipelineLogger({ source: 'extractor:lever' });
    this.apiBase = 'https://api.lever.co/v0/postings';
  }

  canHandle(url) {
    return url && (url.toLowerCase().includes('lever.co') || url.toLowerCase().includes('lever'));
  }

  async extractJobs(companyName, careersUrl) {
    try {
      const domain = this._extractDomain(careersUrl, companyName);
      if (!domain) return [];
      return await this._fetchAllJobs(domain, companyName);
    } catch (err) {
      this.logger.error(`Lever extract failed for ${companyName}: ${err.message}`);
      return [];
    }
  }

  _extractDomain(url, companyName) {
    if (!url) return companyName.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const match = url.match(/lever\.co\/([^/?#]+)/);
    return match ? match[1] : companyName.toLowerCase().replace(/[^a-z0-9-]/g, '');
  }

  async _fetchAllJobs(domain, companyName) {
    try {
      const url = `${this.apiBase}/${domain}?mode=json`;
      const { data } = await axios.get(url, { timeout: 15000 });
      const jobs = Array.isArray(data) ? data : [];
      return jobs.map(j => ({
        title: j.text || j.title || '',
        company: companyName,
        location: this._extractLocation(j),
        remote: j.categories?.commitment?.toLowerCase().includes('remote') || false,
        description: this._cleanHtml(j.description || j.content || ''),
        applyUrl: j.hostedUrl || `https://jobs.lever.co/${domain}/${j.id}`,
        source: 'Lever',
        sourceJobId: `lever-${j.id}`,
        skills: this._extractSkills(j.description || j.content || ''),
        postedAt: j.createdAt ? new Date(j.createdAt) : new Date(),
        metadata: {
          team: j.categories?.team || '',
          commitment: j.categories?.commitment || '',
          department: j.categories?.department || ''
        }
      }));
    } catch (err) {
      this.logger.error(`Lever fetch failed for ${domain}: ${err.message}`);
      return [];
    }
  }

  _extractLocation(job) {
    const loc = job.categories?.location || job.location || '';
    if (typeof loc === 'string') return loc;
    if (loc.split) return loc.split(', ').filter(Boolean).join(', ');
    return 'Remote';
  }

  _extractSkills(content) {
    if (!content) return [];
    const skills = new Set();
    const techKeywords = [
      'javascript', 'typescript', 'python', 'java', 'golang', 'react', 'node',
      'aws', 'docker', 'kubernetes', 'postgresql', 'mongodb', 'redis', 'graphql'
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

module.exports = LeverExtractor;

const axios = require('axios');
const PipelineLogger = require('../monitoring/logger');

class WorkableExtractor {
  constructor() {
    this.logger = new PipelineLogger({ source: 'extractor:workable' });
    this.apiBase = 'https://apply.workable.com/api/v3/accounts';
  }

  canHandle(url) {
    return url && url.toLowerCase().includes('workable');
  }

  async extractJobs(companyName, careersUrl) {
    try {
      const subdomain = this._extractSubdomain(careersUrl, companyName);
      if (!subdomain) return [];
      return await this._fetchJobs(subdomain, companyName);
    } catch (err) {
      this.logger.error(`Workable extract failed for ${companyName}: ${err.message}`);
      return [];
    }
  }

  _extractSubdomain(url, companyName) {
    if (!url) return companyName.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const match = url.match(/workable\.com\/([^/?#]+)/);
    if (match) return match[1];
    const subdomainMatch = url.match(/https?:\/\/([^.]+)\.workable\.com/);
    return subdomainMatch ? subdomainMatch[1] : companyName.toLowerCase().replace(/[^a-z0-9-]/g, '');
  }

  async _fetchJobs(subdomain, companyName) {
    try {
      const url = `https://apply.workable.com/${subdomain}/`;
      const { data: html } = await axios.get(url, {
        timeout: 15000,
        headers: { 'Accept': 'text/html' },
        responseType: 'text'
      });

      const jsonLd = this._extractJsonLd(html);
      if (jsonLd.length > 0) {
        return jsonLd.map(j => ({
          title: j.title || '',
          company: companyName,
          location: j.jobLocation?.address?.addressLocality || j.jobLocation || 'Remote',
          remote: (j.jobLocationType || '').toLowerCase().includes('remote') || false,
          description: this._cleanHtml(j.description || ''),
          applyUrl: j.url || j.directApply || `https://apply.workable.com/${subdomain}/j/${j.identifier}/`,
          source: 'Workable',
          sourceJobId: `workable-${j.identifier || Math.random().toString(36).substr(2, 9)}`,
          skills: this._extractSkills(j.description || ''),
          postedAt: j.datePosted ? new Date(j.datePosted) : new Date(),
          salaryMin: j.baseSalary?.value?.minValue || 0,
          salaryMax: j.baseSalary?.value?.maxValue || 0,
          currency: j.baseSalary?.currency || 'USD'
        }));
      }

      return await this._fetchFromApi(subdomain, companyName);
    } catch (err) {
      this.logger.error(`Workable fetch failed for ${subdomain}: ${err.message}`);
      return [];
    }
  }

  async _fetchFromApi(subdomain, companyName) {
    try {
      const url = `${this.apiBase}/${subdomain}/jobs`;
      const { data } = await axios.get(url, {
        timeout: 15000,
        headers: { 'Accept': 'application/json' }
      });

      const jobs = data.jobs || data.results || [];
      return jobs.map(j => ({
        title: j.title || '',
        company: companyName,
        location: j.location?.city || j.location || 'Remote',
        remote: (j.telecommuting || j.remote || '').toString() === 'true' || false,
        description: this._cleanHtml(j.description || j.full_description || ''),
        applyUrl: j.shortlink || j.url || `https://apply.workable.com/${subdomain}/j/${j.id}/`,
        source: 'Workable',
        sourceJobId: `workable-${j.id || Math.random().toString(36).substr(2, 9)}`,
        skills: this._extractSkills(j.description || ''),
        postedAt: j.posted_date || j.created_at ? new Date(j.posted_date || j.created_at) : new Date(),
        salaryMin: j.salary_min || 0,
        salaryMax: j.salary_max || 0,
        currency: j.salary_currency || 'USD',
        metadata: { department: j.department || '', country: j.country || '' }
      }));
    } catch (err) {
      this.logger.error(`Workable API failed for ${subdomain}: ${err.message}`);
      return [];
    }
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
        }
      } catch { }
    }
    return results;
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

module.exports = WorkableExtractor;

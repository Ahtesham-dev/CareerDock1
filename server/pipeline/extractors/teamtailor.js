const axios = require('axios');
const PipelineLogger = require('../monitoring/logger');

class TeamtailorExtractor {
  constructor() {
    this.logger = new PipelineLogger({ source: 'extractor:teamtailor' });
  }

  canHandle(url) {
    return url && (url.toLowerCase().includes('teamtailor') || url.toLowerCase().includes('team-tailor'));
  }

  async extractJobs(companyName, careersUrl) {
    try {
      const domain = this._extractDomain(careersUrl, companyName);
      if (!domain) return [];
      return await this._fetchJobs(domain, companyName);
    } catch (err) {
      this.logger.error(`Teamtailor extract failed for ${companyName}: ${err.message}`);
      return [];
    }
  }

  _extractDomain(url, companyName) {
    if (!url) return companyName.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const match = url.match(/teamtailor\.com\/([^/?#]+)/);
    if (match) return match[1];
    const subdomainMatch = url.match(/https?:\/\/([^.]+)\.teamtailor\.com/);
    return subdomainMatch ? subdomainMatch[1] : companyName.toLowerCase().replace(/[^a-z0-9-]/g, '');
  }

  async _fetchJobs(domain, companyName) {
    try {
      const apiUrl = `https://${domain}.teamtailor.com/api/v1/jobs?include=location`;
      const { data } = await axios.get(apiUrl, {
        timeout: 15000,
        headers: {
          'Accept': 'application/json',
          'X-Api-Version': '20210218'
        }
      });

      const jobs = data.data || [];
      const included = data.included || [];
      const locations = {};
      for (const inc of included) {
        if (inc.type === 'locations') locations[inc.id] = inc.attributes?.name || '';
      }

      return jobs.map(j => {
        const attrs = j.attributes || {};
        const locationId = j.relationships?.location?.data?.id;
        const location = locationId ? locations[locationId] : '';

        return {
          title: attrs.title || '',
          company: companyName,
          location: location || 'Remote',
          remote: (attrs.remote || '').toString() === 'true' || (attrs.location || '').toLowerCase().includes('remote') || false,
          description: this._cleanHtml(attrs.description || attrs.body || ''),
          applyUrl: `https://${domain}.teamtailor.com/jobs/${j.id}`,
          source: 'Teamtailor',
          sourceJobId: `tt-${j.id}`,
          skills: this._extractSkills(attrs.description || ''),
          postedAt: attrs.publication_date ? new Date(attrs.publication_date) : new Date(),
          metadata: {
            department: attrs.department || '',
            employmentType: attrs.employment_type || ''
          }
        };
      });
    } catch (err) {
      this.logger.error(`Teamtailor API failed for ${domain}: ${err.message}`);
      return [];
    }
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

module.exports = TeamtailorExtractor;

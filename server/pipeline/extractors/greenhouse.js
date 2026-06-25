const axios = require('axios');
const cheerio = require('cheerio');
const PipelineLogger = require('../monitoring/logger');

class GreenhouseExtractor {
  constructor() {
    this.logger = new PipelineLogger({ source: 'extractor:greenhouse' });
    this.apiBase = 'https://boards-api.greenhouse.io/v1/boards';
    this.departmentsCache = new Map();
  }

  canHandle(url) {
    return url && url.toLowerCase().includes('greenhouse');
  }

  async extractJobs(companyName, careersUrl) {
    try {
      const boardToken = this._extractBoardToken(careersUrl, companyName);
      if (!boardToken) {
        this.logger.warn(`No board token for ${companyName}`);
        return [];
      }
      return await this._fetchAllJobs(boardToken, companyName);
    } catch (err) {
      this.logger.error(`Greenhouse extract failed for ${companyName}: ${err.message}`);
      return [];
    }
  }

  _extractBoardToken(url, companyName) {
    if (!url) return companyName.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const match = url.match(/greenhouse\.io\/([^/?#]+)/);
    return match ? match[1] : companyName.toLowerCase().replace(/[^a-z0-9-]/g, '');
  }

  async _fetchAllJobs(boardToken, companyName) {
    const jobs = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      try {
        const url = `${this.apiBase}/${boardToken}/jobs?content=true&page=${page}`;
        const { data } = await axios.get(url, { timeout: 15000 });
        const apiJobs = data.jobs || [];
        if (apiJobs.length === 0 || !data.meta?.next) hasMore = false;

        for (const j of apiJobs) {
          if (j.status !== 'published' && j.status !== 'active') continue;
          const metadata = this._extractMetadata(j);
          jobs.push({
            title: j.title,
            company: companyName,
            location: this._extractLocation(j),
            remote: j.location?.name?.toLowerCase().includes('remote') || false,
            description: this._cleanHtml(j.content || ''),
            applyUrl: j.absolute_url || `https://boards.greenhouse.io/${boardToken}/jobs/${j.id}`,
            source: 'Greenhouse',
            sourceJobId: `gh-${j.id}`,
            skills: this._extractSkills(j.content || ''),
            postedAt: j.updated_at ? new Date(j.updated_at) : new Date(),
            metadata: { department: metadata.department, office: metadata.office }
          });
        }
        page++;
        await new Promise(r => setTimeout(r, 200 + Math.random() * 300));
      } catch (err) {
        this.logger.error(`Greenhouse page ${page} error: ${err.message}`);
        hasMore = false;
      }
    }

    return jobs;
  }

  _extractLocation(job) {
    if (job.offices && job.offices.length > 0) {
      return job.offices.map(o => o.name).join(', ');
    }
    return job.location?.name || 'Remote';
  }

  _extractMetadata(job) {
    return {
      department: job.departments?.[0]?.name || '',
      office: job.offices?.[0]?.name || ''
    };
  }

  _extractSkills(content) {
    const skills = new Set();
    const techKeywords = [
      'javascript', 'typescript', 'python', 'java', 'golang', 'rust', 'c++', 'ruby',
      'react', 'angular', 'vue', 'node', 'express', 'django', 'flask', 'spring',
      'aws', 'gcp', 'azure', 'docker', 'kubernetes', 'terraform', 'jenkins',
      'postgresql', 'mongodb', 'mysql', 'redis', 'elasticsearch', 'kafka',
      'graphql', 'rest', 'grpc', 'ci/cd', 'agile', 'scrum'
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

module.exports = GreenhouseExtractor;

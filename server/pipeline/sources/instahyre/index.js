const SourceAdapter = require('../baseAdapter');
const PipelineLogger = require('../../monitoring/logger');

class InstahyreAdapter extends SourceAdapter {
  constructor() {
    super('Instahyre');
    this.logger = new PipelineLogger({ source: 'adapter:instahyre' });
  }

  async fetchJobs(context = {}) {
    this.logger.info('Fetching Instahyre jobs via API');
    const allJobs = [];
    const seenIds = new Set();
    const maxPages = context.maxPages || 10;

    for (let page = 0; page < maxPages; page++) {
      const offset = page * 50;
      const jobs = await this._fetchPage(offset);
      if (jobs.length === 0) break;

      for (const j of jobs) {
        if (!seenIds.has(j.id)) {
          seenIds.add(j.id);
          allJobs.push(this._normalizeJob(j));
        }
      }
      this.logger.info(`Fetched page ${page + 1}: ${jobs.length} jobs (total: ${allJobs.length})`);
    }

    this.logger.info(`Total Instahyre jobs fetched: ${allJobs.length}`);
    return allJobs;
  }

  async _fetchPage(offset) {
    try {
      const response = await this.http.get('https://www.instahyre.com/api/v1/job_search', {
        params: {
          company_size: 0,
          isLandingPage: true,
          job_type: 0,
          offset,
          limit: 50,
          source: 'opportunities'
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Referer': 'https://www.instahyre.com/search-jobs',
          'x-requested-with': 'XMLHttpRequest'
        },
        timeout: 15000
      });

      return response.data?.objects || [];
    } catch (err) {
      this.logger.error(`Failed to fetch offset ${offset}: ${err.message}`);
      return [];
    }
  }

  _normalizeJob(raw) {
    const companyName = raw.employer?.company_name || '';
    const location = raw.locations || 'India';
    const remote = location.toLowerCase().includes('work from home') || location.toLowerCase().includes('remote');
    const skills = raw.keywords || [];
    const applyUrl = raw.public_url || '';
    const logo = raw.employer?.profile_image_src || '';

    return {
      title: raw.candidate_title || raw.title || '',
      company: companyName,
      location,
      remote,
      salaryMin: 0,
      salaryMax: 0,
      currency: 'INR',
      skills,
      description: '',
      applyUrl,
      source: 'Instahyre',
      sourceJobId: raw.id ? `ih-${raw.id}` : '',
      postedAt: new Date(),
      tags: skills,
      logo,
      metadata: { instahyreId: raw.id, employerId: raw.employer?.id }
    };
  }
}

module.exports = InstahyreAdapter;

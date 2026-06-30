const SourceAdapter = require('../baseAdapter');
const PipelineLogger = require('../../monitoring/logger');

const SKILL_PAGES = [
  'reactjs', 'python', 'nodejs', 'javascript', 'java', 'golang', 'devops',
  'frontend', 'backend', 'fullstack', 'data-science', 'machine-learning',
  'angular', 'flutter', 'android', 'ios', 'laravel', 'ruby-on-rails',
  'aws', 'qa-software-testing', 'product-manager', 'ui-ux-designer', 'digital-marketing',
  'php', 'sql', 'typescript', 'dotnet', 'cyber-security', 'blockchain',
  'data-analytics', 'react-native', 'vue-js', 'svelte', 'rust', 'cplusplus'
];

class CutshortAdapter extends SourceAdapter {
  constructor() {
    super('Cutshort');
    this.logger = new PipelineLogger({ source: 'adapter:cutshort' });
  }

  async fetchJobs(context = {}) {
    this.logger.info('Fetching Cutshort jobs');
    const allJobs = [];
    const seenIds = new Set();
    const skills = context.skills || SKILL_PAGES;

    for (const skill of skills) {
      const jobs = await this._scrapeSkillPage(skill);
      for (const j of jobs) {
        if (!seenIds.has(j._id)) {
          seenIds.add(j._id);
          allJobs.push(this._normalizeJob(j, skill));
        }
      }
      if (allJobs.length >= 300) break;
      await new Promise(r => setTimeout(r, 500));
    }

    this.logger.info(`Total Cutshort jobs fetched: ${allJobs.length}`);
    return allJobs;
  }

  async _scrapeSkillPage(skill) {
    try {
      const url = `https://cutshort.io/jobs/${skill}-jobs`;
      const response = await this.http.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        },
        timeout: 30000
      });

      const match = response.data.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
      if (!match) return [];

      const parsed = JSON.parse(match[1]);
      const jobs = parsed?.props?.pageProps?.dehydratedState?.queries?.[0]?.state?.data?.data?.pageData?.jobs;
      if (!Array.isArray(jobs)) return [];

      this.logger.info(`Found ${jobs.length} jobs for skill: ${skill}`);
      return jobs;
    } catch (err) {
      this.logger.error(`Failed to scrape ${skill}: ${err.message}`);
      return [];
    }
  }

  _normalizeJob(raw, skill) {
    const companyName = raw.companyDetails?.name || raw.companyId?.name || '';
    const location = raw.locationsText || (Array.isArray(raw.locations) ? raw.locations.join(', ') : 'India');
    const salary = raw.salaryRange || {};
    const description = raw.sanitizedComment || '';
    const applyUrl = raw.publicUrl || raw.authApplyUrl || '';
    const remote = raw.remoteType === 'remote_okay' || raw.remoteType === 'hybrid';
    const logo = raw.companyDetails?.logo || '';

    return {
      title: raw.headline || '',
      company: companyName,
      location,
      remote,
      salaryMin: salary.min || 0,
      salaryMax: salary.max || 0,
      currency: salary.currency || 'INR',
      skills: raw.allSkills || [],
      description,
      applyUrl,
      source: 'Cutshort',
      sourceJobId: raw._id ? `cs-${raw._id}` : '',
      postedAt: new Date(),
      tags: raw.allSkills || [],
      logo,
      metadata: { cutshortId: raw._id, skill, roleTypes: raw.roleTypes }
    };
  }
}

module.exports = CutshortAdapter;

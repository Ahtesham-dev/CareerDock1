const axios = require('axios');
const SourceAdapter = require('../baseAdapter');
const PipelineLogger = require('../../monitoring/logger');
const RateLimiter = require('../../queue/rateLimiter');

class PeerlistAdapter extends SourceAdapter {
  constructor() {
    super('Peerlist');
    this.logger = new PipelineLogger({ source: 'adapter:peerlist' });
    this.rateLimiter = new RateLimiter({ requestsPerSecond: 2, burstSize: 3 });
  }

  async fetchJobs(context = {}) {
    this.logger.info('Fetching Peerlist jobs via web scrape');
    const allJobs = await this._scrapeJobsPage();
    this.logger.info(`Total Peerlist jobs fetched: ${allJobs.length}`);
    return allJobs;
  }

  async _scrapeJobsPage() {
    const jobs = [];

    try {
      await this.rateLimiter.acquire();
      const { data: html } = await axios.get('https://peerlist.io/jobs', {
        timeout: 20000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml'
        },
        responseType: 'text'
      });

      const nextData = this._extractNextData(html);
      if (nextData && nextData.props?.pageProps?.jobs) {
        for (const j of nextData.props.pageProps.jobs) {
          jobs.push(this._normalizePeerlistJob(j));
        }
        this.logger.info(`Extracted ${jobs.length} jobs from __NEXT_DATA__`);
        return jobs;
      }

      if (nextData && nextData.props?.pageProps?.listings) {
        for (const j of nextData.props.pageProps.listings) {
          jobs.push(this._normalizePeerlistJob(j));
        }
        this.logger.info(`Extracted ${jobs.length} jobs from __NEXT_DATA__ listings`);
        return jobs;
      }

      const cheerio = require('cheerio');
      const $ = cheerio.load(html);

      const pageJson = $('#__NEXT_DATA__').html();
      if (pageJson) {
        try {
          const parsed = JSON.parse(pageJson);
          const jobData = parsed?.props?.pageProps?.jobs || parsed?.props?.pageProps?.listings || [];
          if (jobData.length > 0) {
            for (const j of jobData) {
              jobs.push(this._normalizePeerlistJob(j));
            }
            this.logger.info(`Extracted ${jobs.length} jobs from Next.js data`);
            return jobs;
          }
        } catch { }
      }

      $('[class*="job-card"], [class*="JobCard"], [class*="jobcard"], [class*="listing"], article').each((_, el) => {
        const title = $(el).find('[class*="title"], [class*="Title"], h2, h3, [class*="role"]').first().text().trim();
        if (!title || title.length < 3) return;
        const company = $(el).find('[class*="company"], [class*="Company"], [class*="org"]').first().text().trim();
        const location = $(el).find('[class*="location"], [class*="Location"]').first().text().trim();
        const link = $(el).find('a[href*="/jobs/"]').first().attr('href') || $(el).find('a').first().attr('href') || '';
        const desc = $(el).find('[class*="description"], [class*="Description"], p').first().text().trim();
        const skills = [];
        $(el).find('[class*="skill"], [class*="Skill"], [class*="tag"], [class*="Tag"], [class*="badge"]').each((_, s) => {
          const t = $(s).text().trim();
          if (t) skills.push(t);
        });

        jobs.push(this._normalizePeerlistJob({
          title, company, location,
          applyUrl: link.startsWith('http') ? link : `https://peerlist.io${link}`,
          description: desc,
          skills
        }));
      });

      if (jobs.length > 0) {
        this.logger.info(`Extracted ${jobs.length} jobs via DOM parsing`);
        return jobs;
      }
    } catch (err) {
      this.logger.error(`Peerlist scrape failed: ${err.message}`);
    }

    return jobs;
  }

  _extractNextData(html) {
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch { }
    }
    return null;
  }

  _normalizePeerlistJob(raw) {
    const companyName = typeof raw.company === 'object' ? (raw.company?.name || raw.company?.title || '') : (raw.company || '');
    return {
      title: raw.title || raw.role || raw.position || '',
      company: companyName,
      location: raw.location || raw.loc || 'Remote',
      remote: (raw.location || '').toLowerCase().includes('remote') || raw.remote || raw.remote_ok || false,
      salaryMin: raw.salaryMin || raw.minSalary || raw.salary?.min || raw.salary_min || 0,
      salaryMax: raw.salaryMax || raw.maxSalary || raw.salary?.max || raw.salary_max || 0,
      skills: Array.isArray(raw.skills) ? raw.skills.map(s => typeof s === 'string' ? s : s.name || s.title || '') : [],
      description: raw.description || raw.body || raw.summary || '',
      applyUrl: raw.applyUrl || raw.url || raw.apply_link || raw.apply_url || '',
      source: 'Peerlist',
      sourceJobId: raw.id ? `pl-${raw.id}` : '',
      postedAt: raw.postedAt || raw.createdAt || raw.posted_date || raw.date ? new Date(raw.postedAt || raw.createdAt || raw.posted_date || raw.date) : new Date(),
      tags: raw.tags || raw.skills?.map?.(s => s.name || s) || [],
      logo: typeof raw.company === 'object' ? (raw.company?.logo || '') : (raw.logo || ''),
      metadata: { peerlistId: raw.id }
    };
  }
}

module.exports = PeerlistAdapter;

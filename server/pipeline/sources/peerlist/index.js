const SourceAdapter = require('../baseAdapter');
const PipelineLogger = require('../../monitoring/logger');
const { launchBrowser } = require('../../../lib/browser/launcher');

class PeerlistAdapter extends SourceAdapter {
  constructor() {
    super('Peerlist');
    this.logger = new PipelineLogger({ source: 'adapter:peerlist' });
  }

  async fetchJobs(context = {}) {
    this.logger.info('Fetching Peerlist jobs via puppeteer');
    const allJobs = await this._scrapeJobsPage();
    this.logger.info(`Total Peerlist jobs fetched: ${allJobs.length}`);
    return allJobs;
  }

  async _scrapeJobsPage() {
    const jobs = [];

    try {
      const html = await this._fetchPageWithBrowser();
      if (!html) return jobs;

      const rawJobs = this._extractJobsFromHtml(html);
      if (rawJobs.length > 0) {
        for (const j of rawJobs) {
          jobs.push(this._normalizePeerlistJob(j));
        }
        this.logger.info(`Extracted ${jobs.length} jobs from Peerlist`);
        return jobs;
      }
    } catch (err) {
      this.logger.error(`Peerlist scrape failed: ${err.message}`);
    }

    return jobs;
  }

  async _fetchPageWithBrowser() {
    let browser;
    try {
      browser = await launchBrowser();
    } catch (err) {
      this.logger.error(`Peerlist browser unavailable: ${err.message}`);
      return null;
    }

    try {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36');
      await page.setViewport({ width: 1280, height: 800 });

      await page.goto('https://peerlist.io/jobs', {
        waitUntil: 'networkidle0',
        timeout: 60000
      });

      await new Promise(r => setTimeout(r, 5000));

      return await page.content();
    } catch (err) {
      this.logger.error(`Browser fetch failed: ${err.message}`);
      return null;
    } finally {
      if (browser) await browser.close();
    }
  }

  _extractJobsFromHtml(html) {
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (!match) return [];

    try {
      const parsed = JSON.parse(match[1]);
      return parsed?.props?.pageProps?.jobs
        || parsed?.props?.pageProps?.listings
        || parsed?.props?.pageProps?.jobsData?.jobs
        || [];
    } catch {
      return [];
    }
  }

  _normalizePeerlistJob(raw) {
    const companyName = typeof raw.company === 'object'
      ? (raw.company?.name || raw.company?.title || '')
      : (raw.company || '');
    const locArr = Array.isArray(raw.location) ? raw.location : [];
    const locText = locArr.length > 0
      ? [locArr[0].city, locArr[0].country].filter(Boolean).join(', ')
      : (raw.location?.text || raw.location?.name || raw.loc || 'Remote');
    const skillArr = Array.isArray(raw.skills)
      ? raw.skills.map(s => typeof s === 'string' ? s : (s.name || s.title || ''))
      : [];
    const salary = raw.salary || {};
    return {
      title: raw.jobTitle || raw.title || raw.role || raw.position || '',
      company: companyName,
      location: locText,
      remote: (raw.locationPreference || '').toLowerCase() === 'remote',
      salaryMin: salary.min || raw.salaryMin || raw.minSalary || 0,
      salaryMax: salary.max || raw.salaryMax || raw.maxSalary || 0,
      currency: salary.currency || 'USD',
      skills: skillArr,
      description: raw.description || raw.body || raw.summary || raw.about || '',
      applyUrl: raw.applyUrl || raw.url || `https://peerlist.io/jobs/${raw.jobId}`,
      source: 'Peerlist',
      sourceJobId: (raw.id || raw.jobId) ? `pl-${raw.id || raw.jobId}` : '',
      postedAt: raw.publishedAt || raw.postedAt || raw.createdAt ? new Date(raw.publishedAt || raw.postedAt || raw.createdAt) : new Date(),
      tags: skillArr,
      logo: typeof raw.company === 'object' ? (raw.company?.logo || '') : (raw.logo || ''),
      metadata: { peerlistId: raw.id || raw.jobId }
    };
  }
}

module.exports = PeerlistAdapter;

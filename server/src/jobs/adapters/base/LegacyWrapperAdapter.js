const BaseAdapter = require('./BaseAdapter');

class LegacyWrapperAdapter extends BaseAdapter {
  constructor(sourceName, ScraperClass) {
    super(sourceName);
    this.ScraperClass = ScraperClass;
  }

  async fetchJobs(context) {
    const scraper = new this.ScraperClass();
    const jobs = await scraper.run();
    return jobs.map(j => ({
      ...j,
      applyUrl: j.applyUrl || j.externalUrl || '',
      sourceJobId: j.sourceJobId || `${this.source.toLowerCase()}-${Buffer.from(j.title + j.company).toString('base64').substr(0, 12)}`
    }));
  }
}

module.exports = LegacyWrapperAdapter;

const BaseAdapter = require('../base/BaseAdapter');
const GreenhouseExtractor = require('../../../../pipeline/extractors/greenhouse');

class GreenhouseAdapter extends BaseAdapter {
  constructor() {
    super('Greenhouse');
    this.extractor = new GreenhouseExtractor();
  }

  async fetchJobs(context = {}) {
    const { companyName, careersUrl } = context;
    if (!companyName || !careersUrl) return [];
    const jobs = await this.extractor.extractJobs(companyName, careersUrl);
    return jobs.map(j => ({
      ...j,
      sourceJobId: j.sourceJobId || `gh-${Buffer.from(j.title + companyName).toString('base64').substr(0, 10)}`
    }));
  }
}

module.exports = GreenhouseAdapter;

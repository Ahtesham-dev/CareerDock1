const BaseAdapter = require('../base/BaseAdapter');
const AshbyExtractor = require('../../../../pipeline/extractors/ashby');

class AshbyAdapter extends BaseAdapter {
  constructor() {
    super('Ashby');
    this.extractor = new AshbyExtractor();
  }

  async fetchJobs(context = {}) {
    const { companyName, careersUrl } = context;
    if (!companyName || !careersUrl) return [];
    const jobs = await this.extractor.extractJobs(companyName, careersUrl);
    return jobs.map(j => ({
      ...j,
      sourceJobId: j.sourceJobId || `ashby-${Buffer.from(j.title + companyName).toString('base64').substr(0, 10)}`
    }));
  }
}

module.exports = AshbyAdapter;

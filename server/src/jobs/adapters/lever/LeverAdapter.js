const BaseAdapter = require('../base/BaseAdapter');
const LeverExtractor = require('../../../../pipeline/extractors/lever');

class LeverAdapter extends BaseAdapter {
  constructor() {
    super('Lever');
    this.extractor = new LeverExtractor();
  }

  async fetchJobs(context = {}) {
    const { companyName, careersUrl } = context;
    if (!companyName || !careersUrl) return [];
    const jobs = await this.extractor.extractJobs(companyName, careersUrl);
    return jobs.map(j => ({
      ...j,
      sourceJobId: j.sourceJobId || `lever-${Buffer.from(j.title + companyName).toString('base64').substr(0, 10)}`
    }));
  }
}

module.exports = LeverAdapter;

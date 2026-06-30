const SourceAdapter = require('../baseAdapter');
const PipelineLogger = require('../../monitoring/logger');

class HirectAdapter extends SourceAdapter {
  constructor() {
    super('Hirect');
    this.logger = new PipelineLogger({ source: 'adapter:hirect' });
  }

  async fetchJobs(context = {}) {
    this.logger.info('Hirect is a mobile-only app with no public web API or job listings page. Returning 0 jobs.');
    return [];
  }
}

module.exports = HirectAdapter;

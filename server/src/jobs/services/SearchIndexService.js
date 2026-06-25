const { PipelineJob } = require('../../../pipeline/models');

class SearchIndexService {
  async buildSearchText(job) {
    const searchText = [
      job.title || '',
      job.company || '',
      ...(job.skills || []),
      job.location || '',
      ...(job.tags || [])
    ].join(' ').toLowerCase();

    return {
      searchText,
      companyKeywords: (job.company || '').toLowerCase().split(/\s+/).filter(Boolean),
      skillKeywords: (job.skills || []).map(s => s.toLowerCase()),
      locationKeywords: (job.location || '').toLowerCase().split(/\s+/).filter(Boolean)
    };
  }
}

module.exports = new SearchIndexService();

const YCCompanyRegistry = require('./companyRegistry');
const { getExtractor } = require('../../extractors');
const YCDirectExtractor = require('./directExtractor');
const SourceAdapter = require('../baseAdapter');
const { CompanyRegistry, PipelineJob } = require('../../models');
const PipelineLogger = require('../../monitoring/logger');

class YCombinatorAdapter extends SourceAdapter {
  constructor() {
    super('YCombinator');
    this.registry = new YCCompanyRegistry();
    this.directExtractor = new YCDirectExtractor();
    this.logger = new PipelineLogger({ source: 'adapter:ycombinator' });
  }

  async discover() {
    return this.registry.refresh();
  }

  async fetchJobs(context = {}) {
    const { refreshRegistry = true, maxCompanies = null } = context;
    if (refreshRegistry) {
      this.logger.info('Refreshing YC company registry');
      await this.discover();
    }

    const query = { active: true, careersUrl: { $ne: '' } };
    const companies = await CompanyRegistry.find(query).limit(maxCompanies || 500).lean();
    this.logger.info(`Fetching jobs for ${companies.length} YC companies`);

    const allJobs = [];

    for (const company of companies) {
      try {
        const extractor = getExtractor(company.careersUrl);
        let jobs = [];

        if (extractor) {
          this.logger.debug(`Using ${extractor.constructor.name} for ${company.name}`);
          jobs = await extractor.extractJobs(company.name, company.careersUrl);
        } else {
          jobs = await this.directExtractor.extractJobs(company);
        }

        for (const job of jobs) {
          job.companySlug = (company.name || '').toLowerCase().replace(/[^a-z0-9-]/g, '-');
          job.tags = company.tags || [];
          job.logo = company.logo || '';
          job.metadata = {
            ...job.metadata,
            ycBatch: company.batch,
            ycUrl: company.ycUrl,
            industry: company.industry
          };
        }

        allJobs.push(...jobs);
      } catch (err) {
        this.logger.error(`Failed to extract jobs for ${company.name}: ${err.message}`);
      }

      await new Promise(r => setTimeout(r, 500 + Math.random() * 1500));
    }

    this.logger.info(`Total YC jobs extracted: ${allJobs.length}`);
    return allJobs;
  }
}

module.exports = YCombinatorAdapter;

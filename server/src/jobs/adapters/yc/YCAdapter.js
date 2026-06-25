const BaseAdapter = require('../base/BaseAdapter');
const YCCompanyRegistry = require('../../../../pipeline/sources/ycombinator/companyRegistry');
const { getExtractor } = require('../../../../pipeline/extractors');
const YCDirectExtractor = require('../../../../pipeline/sources/ycombinator/directExtractor');

class YCAdapter extends BaseAdapter {
  constructor() {
    super('YCombinator');
    this.registry = new YCCompanyRegistry();
    this.directExtractor = new YCDirectExtractor();
  }

  async discover() {
    return this.registry.refresh();
  }

  async fetchJobs(context = {}) {
    const { refreshRegistry = true, maxCompanies = 500 } = context;
    if (refreshRegistry) await this.discover();

    const { CompanyRegistry } = require('../../../../pipeline/models');
    const companies = await CompanyRegistry.find({ active: true, careersUrl: { $ne: '' } })
      .limit(maxCompanies).lean();

    const allJobs = [];
    for (const company of companies) {
      try {
        const extractor = getExtractor(company.careersUrl);
        let jobs = extractor
          ? await extractor.extractJobs(company.name, company.careersUrl)
          : await this.directExtractor.extractJobs(company);

        for (const job of jobs) {
          job.companySlug = (company.name || '').toLowerCase().replace(/[^a-z0-9-]/g, '-');
          job.tags = company.tags || [];
          job.logo = company.logo || '';
          job.sourceJobId = job.sourceJobId || `${company.name.toLowerCase().replace(/\s+/g, '-')}-${Buffer.from(job.title).toString('base64').substr(0, 10)}`;
        }
        allJobs.push(...jobs);
      } catch (err) {
        console.warn(`[YCAdapter] Failed for ${company.name}: ${err.message}`);
      }
      await new Promise(r => setTimeout(r, 500 + Math.random() * 1500));
    }
    return allJobs;
  }
}

module.exports = YCAdapter;

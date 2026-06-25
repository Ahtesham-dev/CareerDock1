const YCCompanyRegistry = require('../../../pipeline/sources/ycombinator/companyRegistry');

class CompanyDiscoveryService {
  constructor() {
    this.registry = new YCCompanyRegistry();
  }

  async discoverYCBatch(batch) {
    return this.registry._discoverBatch(batch);
  }

  async refreshAll() {
    return this.registry.refresh();
  }
}

module.exports = CompanyDiscoveryService;

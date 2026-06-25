const { getExtractor } = require('../../../pipeline/extractors');
const YCDirectExtractor = require('../../../pipeline/sources/ycombinator/directExtractor');

class CareerPageCrawler {
  constructor() {
    this.directExtractor = new YCDirectExtractor();
  }

  detectPlatform(careersUrl) {
    return getExtractor(careersUrl);
  }

  async crawl(company, careersUrl) {
    const extractor = this.detectPlatform(careersUrl);
    if (extractor) {
      return extractor.extractJobs(company, careersUrl);
    }
    return this.directExtractor.extractJobs({ name: company, careersUrl, website: careersUrl });
  }
}

module.exports = CareerPageCrawler;

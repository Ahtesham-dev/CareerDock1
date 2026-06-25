const YCAdapter = require('./adapters/yc/YCAdapter');
const PeerlistAdapter = require('./adapters/peerlist/PeerlistAdapter');
const GreenhouseAdapter = require('./adapters/greenhouse/GreenhouseAdapter');
const LeverAdapter = require('./adapters/lever/LeverAdapter');
const AshbyAdapter = require('./adapters/ashby/AshbyAdapter');
const LegacyWrapperAdapter = require('./adapters/base/LegacyWrapperAdapter');

const JobNormalizer = require('./services/JobNormalizer');
const DeduplicationService = require('./services/DeduplicationService');
const ValidationService = require('./services/ValidationService');
const CompanyDiscoveryService = require('./services/CompanyDiscoveryService');
const CareerPageCrawler = require('./services/CareerPageCrawler');
const SearchIndexService = require('./services/SearchIndexService');
const SchedulerService = require('./services/SchedulerService');
const JobQueue = require('./queue/JobQueue');
const JobWorker = require('./workers/JobWorker');
const config = require('./config');

function getAdapter(sourceName) {
  const adapters = {
    ycombinator: new YCAdapter(),
    peerlist: new PeerlistAdapter(),
    greenhouse: new GreenhouseAdapter(),
    lever: new LeverAdapter(),
    ashby: new AshbyAdapter()
  };
  return adapters[sourceName.toLowerCase()] || null;
}

module.exports = {
  YCAdapter,
  PeerlistAdapter,
  GreenhouseAdapter,
  LeverAdapter,
  AshbyAdapter,
  LegacyWrapperAdapter,
  JobNormalizer,
  DeduplicationService,
  ValidationService,
  CompanyDiscoveryService,
  CareerPageCrawler,
  SearchIndexService,
  SchedulerService,
  JobQueue,
  JobWorker,
  config,
  getAdapter
};

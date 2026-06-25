const GreenhouseExtractor = require('./greenhouse');
const LeverExtractor = require('./lever');
const AshbyExtractor = require('./ashby');
const WorkableExtractor = require('./workable');
const TeamtailorExtractor = require('./teamtailor');

const EXTRACTORS = [
  new GreenhouseExtractor(),
  new LeverExtractor(),
  new AshbyExtractor(),
  new WorkableExtractor(),
  new TeamtailorExtractor()
];

function getExtractor(careersUrl) {
  if (!careersUrl) return null;
  for (const extractor of EXTRACTORS) {
    if (extractor.canHandle(careersUrl)) return extractor;
  }
  return null;
}

module.exports = { GreenhouseExtractor, LeverExtractor, AshbyExtractor, WorkableExtractor, TeamtailorExtractor, getExtractor, EXTRACTORS };

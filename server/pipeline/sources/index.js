const YCombinatorAdapter = require('./ycombinator');
const PeerlistAdapter = require('./peerlist');
const CutshortAdapter = require('./cutshort');
const InstahyreAdapter = require('./instahyre');
const HirectAdapter = require('./hirect');

const SOURCES = {
  ycombinator: new YCombinatorAdapter(),
  peerlist: new PeerlistAdapter(),
  cutshort: new CutshortAdapter(),
  instahyre: new InstahyreAdapter(),
  hirect: new HirectAdapter()
};

function getSource(name) {
  return SOURCES[name.toLowerCase()] || null;
}

function getAllSources() {
  return Object.entries(SOURCES).map(([key, adapter]) => ({
    key,
    name: adapter.name
  }));
}

module.exports = { YCombinatorAdapter, PeerlistAdapter, CutshortAdapter, InstahyreAdapter, HirectAdapter, SOURCES, getSource, getAllSources };

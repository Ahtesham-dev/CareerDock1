const YCombinatorAdapter = require('./ycombinator');
const PeerlistAdapter = require('./peerlist');

const SOURCES = {
  ycombinator: new YCombinatorAdapter(),
  peerlist: new PeerlistAdapter()
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

module.exports = { YCombinatorAdapter, PeerlistAdapter, SOURCES, getSource, getAllSources };

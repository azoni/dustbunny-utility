const mongoClient = require('../AssetsMongoHandler.js');

let data_node;
const UPDATE_INTERVAL_MS = 15_000;
let mongoConnected = false;
let watchlist_timout;
let watchlist = [];
let watchlist_slugs_only = [];

try {
  // eslint-disable-next-line global-require
  data_node = require('../data_node');
} catch (error) {
  console.warn('data_node file not found for watchlist retreiver')
}

/**
 * Starts retrieving watchlist.
 */
async function startLoop() {
  await ensureMongoConnected();
  clearTimeout(watchlist_timout);
  await fetch_watch_list_loop();
}

async function ensureMongoConnected() {
  if (!mongoConnected) {
    await mongoClient.connect();
    mongoConnected = true;
  }
}

async function fetch_watch_list_loop() {
  const fetchedWatchList = await tryFetchningWatchListOrUseDefault();
  saveWatchList(fetchedWatchList);
  clearTimeout(watchlist_timout);
  watchlist_timout = setTimeout(fetch_watch_list_loop, UPDATE_INTERVAL_MS);
}

async function tryFetchningWatchListOrUseDefault() {
  let w;
  try {
    w = await mongoClient.readWatchList();
  } catch (error) {
    console.warn('error fetching watchlist from mongo');
    w = data_node?.WATCH_LIST;
  }
  w = w || [];
  return w;
}

/**
 * Stops retreiving watchlist.
 */
function stopLoop() {
  clearTimeout(watchlist_timout);
}

function getWatchList() {
  return watchlist;
}

function getWatchListSlugsOnly() {
  return watchlist_slugs_only;
}

function saveWatchList(w = []) {
  watchlist = w;
  watchlist_slugs_only = w.map(({ slug }) => slug);
}

module.exports = {
  startLoop,
  stopLoop,
  getWatchList,
  getWatchListSlugsOnly,
};

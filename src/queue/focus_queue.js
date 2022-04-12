/* eslint-disable no-continue */
const throttledQueue = require('throttled-queue');
const watchlistupdater = require('../utility/watchlist_retreiver.js');

const redis_handler = require('../handlers/redis_handler.js');
const opensea_handler = require('../handlers/opensea_handler.js');
const mongo_handler = require('../handlers/mongo_handler.js');

const { seaport } = opensea_handler;

const TIME_LIMIT = 3_000; // ms
const ONE_MINUTE = 60_000;
const FIFTEEN_MINUTES = 15 * 60_000;
const CALLS_PER_TIME_LIMIT = 2;
const openSeaThrottle = throttledQueue(CALLS_PER_TIME_LIMIT, TIME_LIMIT);
const redis_self_throttle = throttledQueue(2, 1_000);
let expirable_commands = [];
let listenSet = [];
let blacklist;

let infinite_timeout;
let toggle = false;
async function infiniteLoop(lastTimeStamp) {
  toggle = !toggle;
  const more = toggle ? await redis_self_throttle(getRedisCommandList) : [];
  const hashlist = more.map(({ hash }) => hash);
  const slugToContractDict = {};
  for (const { slug, token_ids, collection_address = '' } of more) {
    let tier = '';
    if (slug in slugToContractDict) {
      tier = slugToContractDict[slug];
    } else {
      const w = watchlistupdater.getWatchList();
      const coll = w.find(({ slug: someSlug }) => someSlug === slug) || {};
      tier = coll?.tier || '';
      slugToContractDict[slug] = tier;
    }
    for (const token_id of token_ids) {
      redis_handler.redis_push('high', {
        token_id,
        token_address: collection_address,
        slug,
        event_type: 'focus',
        tier: tier || '',
      });
      registerBidAttempted(slug, token_id)
    }
  }
  const changesMade = removeCollisionsAndExpirations(hashlist);
  const more_expirable_commands = more
    .map((c) => expirable_command_factory(c));
  expirable_commands.push(...more_expirable_commands);

  if (more.length || changesMade) {
    saveListenSet();
  }
  const t = Date.now();
  if (lastTimeStamp === undefined) {
    const s = Date.now();
    await queryAllOrders();
    const e = Date.now();
    // console.log(`time: ${e - s}ms`)
  } else {
    const s = Date.now();
    await queryAllOrders(lastTimeStamp);
    const e = Date.now();
    console.log(`********************* time: ${e - s}ms **************************`)
  }
  clearTimeout(infinite_timeout);
  infinite_timeout = setTimeout(() => { infiniteLoop(t) }, 0);
}

function upsertSlug(dictionary, slug, collection_address, tier) {
  if (slug in dictionary) { return; }
  // eslint-disable-next-line no-param-reassign
  dictionary[slug] = { collection_address, tier, tokenIds: [] };
}
let expiration_check_timeout;
const bid_placed_db = {};
async function expiration_check_loop() {
  const expiredBidsDictionary = aggregateAllExpiredBids();
  await bid_on_expired_items(expiredBidsDictionary);
  clearTimeout(expiration_check_timeout);
  expiration_check_timeout = setTimeout(expiration_check_loop, ONE_MINUTE);
}

async function bid_on_expired_items(expiredBidsDictionary) {
  for (const slug in expiredBidsDictionary) {
    const { tokenIds, collection_address, tier } = expiredBidsDictionary[slug];
    for (const tokenId of tokenIds) {
      console.log(`sending expired: ${slug}:${tokenId}`);
      redis_handler.redis_push('high', {
        token_id: tokenId,
        token_address: collection_address,
        slug,
        event_type: 'focus',
        tier: tier || '',
      });
      registerBidAttempted(slug, tokenId);
    }
  }
}
function cleanup_stale_token_ids(token_id_dict, valid_token_ids) {
  const my_valid_token_ids = new Set(valid_token_ids || []);
  for (const token_id in token_id_dict) {
    if (!my_valid_token_ids.has(token_id)) {
      // eslint-disable-next-line no-param-reassign
      delete token_id_dict[token_id];
    }
  }
}

function aggregateAllExpiredBids() {
  const expired_bids = {};
  const now = Date.now();
  const w = watchlistupdater.getWatchList();
  for (const { slug, collection_address, token_ids } of listenSet) {
    if (slug in bid_placed_db) {
      cleanup_stale_token_ids(bid_placed_db[slug], token_ids);
      const { tier = '' } = w.find(({ slug: someSlug }) => someSlug === slug) || {};
      for (const tokenId in bid_placed_db[slug]) {
        const timestamp = bid_placed_db[slug][tokenId];
        if (Number.isNaN(timestamp) || (now - timestamp) > FIFTEEN_MINUTES) {
          upsertSlug(expired_bids, slug, collection_address, tier);
          console.log(`EXPIRED ITEM FOUND: ${slug}:${tokenId}`)
          expired_bids[slug].tokenIds.push(tokenId);
        }
      }
    }
  }
  return expired_bids;
}

function sliceIntoChunks(arr, chunkSize) {
  const res = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    const chunk = arr.slice(i, i + chunkSize);
    res.push(chunk);
  }
  return res;
}
function shuffle(array) {
  let currentIndex = array.length;
  let randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex !== 0) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    // eslint-disable-next-line no-param-reassign
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

async function queryAllOrders(timestamp) {
  const currTime = Date.now();
  const m = listenSet
    .map((x) => {
      if (x.token_ids?.length > 30) {
        const chunks = sliceIntoChunks(x.token_ids, 30);
        // shuffle to make sure they each get a chance to GET all bids w/ no time window limit
        shuffle(chunks);
        const allQueriesForThisCollection = chunks
          // eslint-disable-next-line max-len
          .map((section) => openSeaThrottle(() => getOrdersForFocusGroup(x.slug, x.collection_address, section, timestamp)));
        // nested promise.all to handle larger than 30 tokenids
        return Promise.all(allQueriesForThisCollection);
      }
      // eslint-disable-next-line max-len
      return openSeaThrottle(() => getOrdersForFocusGroup(x.slug, x.collection_address, x.token_ids, timestamp))
        .catch((e) => console.warn(e))
    })
  return Promise.all(m).then(() => currTime);
}

function expirable_command_factory(command) {
  return {
    hash: command.hash,
    slug: command.slug,
    collection_address: command.collection_address || '',
    token_ids: command.token_ids || [],
    timestamp: Date.now(),
    time_suggestion: command.time_suggestion || undefined,
  }
}

function removeCollisionsAndExpirations(hashes = []) {
  const lenBefore = expirable_commands.length;
  const t = Date.now();
  const LIMIT = 60_000 * 15; // 15 minutes
  const X_MINUTES_AGO = t - LIMIT;
  expirable_commands = expirable_commands
    .filter(({ hash, timestamp, time_suggestion }) => {
      let passesTimeCheck = timestamp > X_MINUTES_AGO;
      // 6e7 is about 16 hours
      // eslint-disable-next-line yoda
      if (time_suggestion !== undefined && 0 < time_suggestion && time_suggestion < 6e7) {
        passesTimeCheck = timestamp > (t - time_suggestion);
      }
      // console.log(`${hash} |  ${((timestamp - (time_suggestion ? t - time_suggestion : X_MINUTES_AGO)) / 60_000).toFixed(2)} minutes to go for expire`);
      return !hashes.includes(hash) && passesTimeCheck;
    });
  return lenBefore !== expirable_commands.length;
}
function buildListenSet() {
  const temp = {};
  const slugContractMap = {};

  for (const el of expirable_commands) {
    slugContractMap[el.collection_address] = el.slug;
    if (!(el.collection_address in temp)) {
      temp[el.collection_address] = new Set();
    }
    const coll_ids = el.token_ids || [];
    const coll_set = temp[el.collection_address];
    for (const id of coll_ids) {
      coll_set.add(id);
    }
  }
  return [temp, slugContractMap];
}

function saveListenSet() {
  console.log('saving....')
  const [s, m] = buildListenSet();
  const l = limitListenSet(s, m);
  listenSet = l;
}

/**
 *
 * @param {*} toListenTo is a hashmap of slug to a Set of token ids.
 * @returns arr of up to 5 collections with 30 token ids each.
 */
function limitListenSet(toListenTo, slugMap) {
  const arr = [];
  for (const key in toListenTo) {
    arr.push({
      slug: slugMap[key] || '',
      collection_address: key,
      token_ids: Array.from(toListenTo[key]),
    })
  }
  arr.sort((a, b) => b.token_ids.length - a.token_ids.length);
  return arr.slice(0, 10);
}
let our_wallets;
let our_addresses;
async function setUpBlacklist() {
  our_wallets = await mongo_handler.get_our_wallets()
  our_addresses = our_wallets.map(({ address }) => address.toLowerCase())
  blacklist = new Set(our_addresses);
}

const slugFocusIteration = {}
async function getOrdersForFocusGroup(slug, contract_address, token_ids, fromTimeStamp, retry = 3) {
  // console.log(`lastTimeStamp: ${fromTimeStamp}`);
  // console.log(`contract: ${constract_address}`);
  // console.log('tokenIds:');
  // console.log(token_ids);
  const mySlug = slug;
  const w = watchlistupdater.getWatchList();
  const collectionDbData = w.find(({ slug: someSlug }) => someSlug === mySlug);
  slugFocusIteration[mySlug] = slugFocusIteration[mySlug] || 0;
  slugFocusIteration[mySlug] = (slugFocusIteration[mySlug] + 1) % 40;

  try {
    const query = {
      order_by: 'eth_price',
      token_ids,
      order_direction: 'desc',
      side: 0,
      asset_contract_address: contract_address,
      limit: 50,
      offset: 0,
    };
    const currTime = Date.now();

    if (fromTimeStamp === undefined) {
      query.listed_after = (currTime - 30_000);
    } else {
      const lastDurationTime = currTime - fromTimeStamp;
      const bufferTime = 1_000;
      query.listed_after = (currTime - lastDurationTime - bufferTime);
    }
    console.log(`listed_after: ${query.listed_after}`);
    const orders = await seaport.api.getOrders(query);
    const tokenIdToTopOrderDict = {};

    const orderArr = orders?.orders || [];
    console.log()
    console.log()
    console.log(`slug: ${slug} ids:`);
    console.log(token_ids);
    console.log(`orders fetched ${orderArr.length}`);
    for (const o of orderArr) {
      console.log(`tokenId: ${o?.asset?.tokenId}, ${o.makerAccount?.address} bid: ${o.currentPrice / 1e18}`);
      if (o?.asset?.tokenId === undefined) { continue; } // skip if theres no tokenId
      if (o?.asset?.tokenId in tokenIdToTopOrderDict) { continue; } // top bid already found
      if (!(o.paymentTokenContract.symbol === 'WETH' || o.paymentTokenContract.symbol === 'ETH')) { continue; }

      tokenIdToTopOrderDict[o?.asset?.tokenId] = {
        address: o?.makerAccount?.address?.toLowerCase(),
        topBid: o.currentPrice / 1e18,
      }
    }
    for (const key in tokenIdToTopOrderDict) {
      if (blacklist.has(tokenIdToTopOrderDict[key].address)) {
        console.log(`We are top bid ${slug} : id: ${key}, ${tokenIdToTopOrderDict[key].topBid}`);
      } else {
        console.log(`sending => top: ${tokenIdToTopOrderDict[key].topBid}, token_id:${key}, slugs: ${slug}`);
        redis_handler.redis_push('high', {
          token_id: key,
          token_address: contract_address,
          slug,
          event_type: 'focus',
          bid_amount: tokenIdToTopOrderDict[key].topBid,
          tier: collectionDbData.tier || '',
        });
        registerBidAttempted(slug, key);
      }
    }
  } catch (error) {
    console.error(error);
    if (retry > 0) {
      // eslint-disable-next-line max-len
      return openSeaThrottle(() => getOrdersForFocusGroup(slug, contract_address, token_ids, fromTimeStamp, retry - 1));
    }
    throw error;
  }
  return undefined;
}
function registerBidAttempted(slug, token_id) {
  upsert_slug_in_db(bid_placed_db, slug);
  bid_placed_db[slug][token_id] = Date.now();
}
function upsert_slug_in_db(db, slug) {
  if (slug in db) { return; }
  // eslint-disable-next-line no-param-reassign
  db[slug] = {};
}
async function start() {
  await setUpBlacklist();
  await watchlistupdater.startLoop();
  expiration_check_loop();
  console.log('STARTING FOCUS QUEUE')
  infiniteLoop();
}

async function getRedisCommandList() {
  let which = ''
  if(process.argv[3]) {
    which = process.argv[3]
  }
  const data = await redis_handler.redis_command_pop(which);
  if (data) {
    console.log(data);
  }
  if (Array.isArray(data)) {
    try {
      return data.map(((j) => JSON.parse(j)))
    } catch (error) {
      console.error(error);
      return [];
    }
  }
  return [];
}

module.exports = { start };

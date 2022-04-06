const throttledQueue = require('throttled-queue');
const watchlistupdater = require('../utility/watchlist_retreiver.js');

const redis_handler = require('../handlers/redis_handler.js');
const opensea_handler = require('../handlers/opensea_handler.js');
const mongo_handler = require('../handlers/mongo_handler.js')

const seaport = opensea_handler.seaport;

const TIME_LIMIT = 3_100; //ms
const CALLS_PER_TIME_LIMIT = 2;
const openSeaThrottle = throttledQueue(CALLS_PER_TIME_LIMIT, TIME_LIMIT);
const redis_self_throttle = throttledQueue(2, 1_000);
let expirable_commands = [];
let listenSet = [];

let infinite_timeout = undefined;
let toggle = false;
async function infiniteLoop(lastTimeStamp) {
  toggle = !toggle;
  const more = toggle? await redis_self_throttle(getRedisCommandList) : [];
  const hashlist = more.map(({ hash }) => hash);
  const changesMade = removeCollisionsAndExpirations(hashlist);
  const more_expirable_commands = more
    .map(c => expirable_command_factory(c));
  expirable_commands.push(...more_expirable_commands);

  if (more.length || changesMade) {
    saveListenSet();
  }
  let t = Date.now();
  if (lastTimeStamp === undefined) {
    const s = Date.now();
    await queryAllOrders();
    const e = Date.now();
    console.log(`time: ${e-s}ms`)
  } else {
    const s = Date.now();
    await queryAllOrders(lastTimeStamp);
    const e = Date.now();
    console.log(`time: ${e-s}ms`)
  }
  clearTimeout(infinite_timeout);
  infinite_timeout = setTimeout(() => { infiniteLoop(t) }, 0);
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
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

async function queryAllOrders(timestamp) {
  const t = timestamp || (Date.now() - (60_000 * 7));
  const currTime = Date.now();
  const m = listenSet
    .map(x => {
      if (x.token_ids?.length > 30) {
        const chunks = sliceIntoChunks(x.token_ids, 30);
        // shuffle to make sure they each get a chance to GET all bids w/ no time window limit
        shuffle(chunks);
        let allQueriesForThisCollection = chunks.map((section) =>
          openSeaThrottle(() => getOrdersForFocusGroup(x.slug ,x.collection_address, section, timestamp))
        );
        // nested promise.all to handle larger than 30 tokenids
        return Promise.all(allQueriesForThisCollection);
      }
      return openSeaThrottle(() => getOrdersForFocusGroup(x.slug ,x.collection_address, x.token_ids, timestamp))
        .catch(e => console.warn(e))
    })
  return Promise.all(m).then(_ => currTime);
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
  expirable_commands =  expirable_commands
    .filter(({ hash, timestamp, time_suggestion }) =>
      {
        let passesTimeCheck = timestamp > X_MINUTES_AGO;
        //6e7 is about 16 hours
        if (time_suggestion !== undefined && 0 < time_suggestion && time_suggestion < 6e7) {
          passesTimeCheck = timestamp > (t - time_suggestion);
        }
        console.log(`${hash} |  ${((timestamp - ( time_suggestion ? t - time_suggestion : X_MINUTES_AGO )) / 60_000).toFixed(2)} minutes to go for expire`);
        return !hashes.includes(hash) && passesTimeCheck;
      }
    );
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
      token_ids: Array.from(toListenTo[key])
    })
  }
  arr.sort((a, b) => b.token_ids.length - a.token_ids.length);
  return arr.slice(0, 8);
}
let our_wallets;
let our_addresses;
async function setUpBlacklist() {
  our_wallets = await mongo_handler.get_our_wallets()
  our_addresses = our_wallets.map(({address}) => address.toLowerCase())
  blacklist = new Set(our_addresses);
}

let blacklist;

const slugFocusIteration = {}
async function getOrdersForFocusGroup(slug, contract_address, token_ids, fromTimeStamp, retry = 3) {
  //console.log(`lastTimeStamp: ${fromTimeStamp}`);
  //console.log(`contract: ${constract_address}`);
  //console.log('tokenIds:');
  //console.log(token_ids);
  const mySlug = slug;
  const w = watchlistupdater.getWatchList();
  let collectionDbData = w.find(({slug}) => slug === mySlug);
  slugFocusIteration[mySlug] = slugFocusIteration[mySlug] || 0;
  slugFocusIteration[mySlug] = (slugFocusIteration[mySlug] + 1) % 40;

  try {
    const query = {
      order_by: 'eth_price',
      token_ids: token_ids,
      order_direction: 'desc',
      side: 0,
      asset_contract_address: contract_address,
      limit: 50,
      offset: 0,
    };
    if (slugFocusIteration[mySlug] !== 0) {
      query.listed_after = (Date.now() - 30_000);
    }
    let orders = await seaport.api.getOrders(query);
    const tokenIdToTopOrderDict = {};

    const orderArr = orders?.orders || [];
    console.log()
    console.log()
    console.log(`slug: ${slug} ids:`);
    console.log(token_ids);
    console.log(`orders fetched ${orderArr.length}`);
    for (o of orderArr) {
      console.log(`tokenId: ${o?.asset?.tokenId}, ${o.makerAccount?.address} bid: ${o.currentPrice/1e18}`);
      if (o?.asset?.tokenId === undefined) { continue; } // skip if theres no tokenId
      if (o?.asset?.tokenId in tokenIdToTopOrderDict) { continue; } // skip if we already found top bid
      if (!(o.paymentTokenContract.symbol === 'WETH' || o.paymentTokenContract.symbol === 'ETH')) { continue; }

      tokenIdToTopOrderDict[o?.asset?.tokenId] = {
        address: o?.makerAccount?.address?.toLowerCase(),
        topBid: o.currentPrice / 1e18,
      }
    }
    if (slugFocusIteration[mySlug] === 0) {
      for (const id of token_ids) {
        if (tokenIdToTopOrderDict[id] === undefined) {
          console.log(`found no bids so sending => token_id:${id}, contract: ${contract_address}, slugs: ${slug}`);
          redis_handler.redis_push('high', {
            "token_id": id,
            "token_address": contract_address,
            "slug": slug,
            "event_type": "focus",
            "tier": collectionDbData.tier || '',
          });
        }
      }
    }
    for (key in tokenIdToTopOrderDict) {
      if (blacklist.has(tokenIdToTopOrderDict[key].address)) {
        console.log(`We are top bid ${slug} : id: ${key}, ${tokenIdToTopOrderDict[key].topBid}`);
      } else {
        console.log(`sending => top: ${tokenIdToTopOrderDict[key].topBid}, token_id:${key}, contract: ${contract_address}, slugs: ${slug}`);
        redis_handler.redis_push('high', {
          "token_id": key,
          "token_address": contract_address,
          "slug": slug,
          "event_type": "focus",
          "bid_amount": tokenIdToTopOrderDict[key].topBid,
          "tier": collectionDbData.tier || '',
        });
      }
    }
  } catch (error) {
    console.error(error);
    if (retry > 0) {
      return await openSeaThrottle(() => getOrdersForFocusGroup(slug, contract_address, token_ids, fromTimeStamp, retry - 1));
    }
    throw error;
  }
}

async function start() {
  await setUpBlacklist();
  await watchlistupdater.startLoop();
  console.log('STARTING FOCUS QUEUE')
  infiniteLoop();
}

async function getRedisCommandList() {
  const data = await redis_handler.redis_command_pop('second');
  console.log(typeof data)
  console.log(data);
  if (Array.isArray(data)) {
    try {
      return data.map((j => JSON.parse(j)))
    } catch (error) {
      console.error(error);
      return [];
    }
  }
  return [];
}

module.exports = { start };
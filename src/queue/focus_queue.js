const throttledQueue = require('throttled-queue');
const watchlistupdater = require('../utility/watchlist_retreiver.js');
const opensea = require("opensea-js")
const Network = opensea.Network;
const OpenSeaPort = opensea.OpenSeaPort;
const Web3ProviderEngine = require("web3-provider-engine");
const providerEngine = new Web3ProviderEngine();
const redis_handler = require('../handlers/redis_handler.js');

const seaport = new OpenSeaPort(
  providerEngine,
  {
    networkName: Network.Main,

  },
  (arg) => console.log(arg)
);
const TIME_LIMIT = 2_000; //ms
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

async function queryAllOrders(timestamp) {
  const t = timestamp || (Date.now() - (60_000 * 7));
  const currTime = Date.now();
  const m = listenSet
    .map(x => 
      openSeaThrottle(() => getOrdersForFocusGroup(x.slug ,x.collection_address, x.token_ids, timestamp))
      .catch(e => console.warn(e))
    )
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
        console.log(`${timestamp - ( time_suggestion ? t - time_suggestion : X_MINUTES_AGO )}ms to go for EXP`);
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
      token_ids: Array.from(toListenTo[key]).slice(0, 30)
    })
  }
  arr.sort((a, b) => b.token_ids.length - a.token_ids.length);
  return arr.slice(0, 5);
}

function randomlyThrow() {
  if (Math.random() < 0.05) {
    throw new Error('random error!!!!');
  }
}

const blacklist = ['0x4d64bDb86C7B50D8B2935ab399511bA9433A3628', '0x18a73AaEe970AF9A797D944A7B982502E1e71556','0x1AEc9C6912D7Da7a35803f362db5ad38207D4b4A', '0x35C25Ff925A61399a3B69e8C95C9487A1d82E7DF'];
async function getOrdersForFocusGroup(slug, contract_address, token_ids, fromTimeStamp, retry = 3) {
  //console.log(`lastTimeStamp: ${fromTimeStamp}`);
  //console.log(`contract: ${constract_address}`);
  //console.log('tokenIds:');
  //console.log(token_ids);

  try {
    randomlyThrow();
    let orders = await seaport.api.getOrders({
      order_by: 'created_date',
      token_ids: token_ids,
      order_direction: 'desc',
      side: 0,
      asset_contract_address: contract_address,
      limit: 50,
      offset: 0
    });
    const topOrderMap = {};
    const orderArr = orders?.orders || [];
    for (o of orderArr) {
      if (!blacklist.includes(o?.makerAccount?.address && o?.asset?.tokenId !== undefined)) {
        const someBid = topOrderMap[o?.asset?.tokenId] || 0;
        const orderBid = o.currentPrice / 1e18;
        topOrderMap[o?.asset?.tokenId] = Math.max(someBid, orderBid);
      }
    }
    for (key in topOrderMap) {
      redis_handler.push_asset_high_priority({
        "token_id": key,
        "token_address": contract_address,
        "slug": slug,
        "event_type": "focus",
        "bid_amount": topOrderMap[key],
      });
      console.log(`sending => top: ${topOrderMap[key]}, token_id:${key}, contract: ${contract_address}, slugs: ${slug}`)
    }
    //for ()
    //console.log(`len: ${orders?.orders?.length}, ${listenSet.length}`);
    //if (orders?.orders?.length) {
    //  console.log(JSON.stringify(orders.orders[0], null, 2));
    //}
  } catch (error) {
    console.error(error);
    if (retry > 0) {
      return await getOrdersForFocusGroup(slug, contract_address, token_ids, fromTimeStamp, retry - 1);
    }
    throw error;
  }
}

async function start() {
  await watchlistupdater.startLoop();
  console.log('STARTING FOCUS QUEUE')
  infiniteLoop();
}

async function getRedisCommandList() {
  const data = await redis_handler.redis_command_pop();
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
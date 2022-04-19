/* eslint-disable no-continue */
// const throttledQueue = require('throttled-queue');
const watchlistupdater = require('../utility/watchlist_retreiver.js');
const opensea_handler = require('../handlers/opensea_handler.js')
const redis_handler = require('../handlers/redis_handler.js')
const mongo_handler = require('../handlers/mongo_handler.js');
const { sleep } = require('../utility/utils.js');

const GET_COMMAND_INTERVAL = 2_000; // ms
const PROCCES_COMMANDS_INTERVAL = 200; // ms
const THRESHOLD_TO_FETCH_MORE_COMMANDS = 5;

const { seaport } = opensea_handler;
const which_queue = 'high';
const fifo_queue = [];
let get_command_timout;
let blacklist;
/**
 * This function is done. It simply fetches more commands from the command queue
 * when it needs them. It needs more commands when the fifo queue length falls
 * below the threshold (e.g. 5).
 */
async function get_command_loop() {
  const my_watchlist = watchlistupdater.getWatchList() || [];
  if (get_fifo_queue_length() < THRESHOLD_TO_FETCH_MORE_COMMANDS) {
    let my_command;
    try {
      my_command = await redis_handler.redis_get_orders_command_pop();
    } catch (error) {
      console.error(error.stack);
      console.error('error while fetching commands');
    }
    if (my_command && Array.isArray(my_command)) {
      for (const some_command of my_command) {
        const watchlist_item = my_watchlist
          .find(({ slug }) => slug === some_command.slug);
        if (watchlist_item) {
          some_command.tier = watchlist_item.tier || ''; // attach tier
          enqueue_onto_fifo_queue(some_command);
        }
      }
    }
  }
  clearTimeout(get_command_timout);
  get_command_timout = setTimeout(get_command_loop, GET_COMMAND_INTERVAL);
}

let process_get_orders_timeout;
/**
 * This function is almost done.
 * It is able to loop through the fifo queue
 * to do a get order for each command in our
 * in memory fifo queue.
 *
 * Calls process_a_single_get_orders to do the get order logic.
 *
 * TODO: look into making it not doing fifo_queue_is_empty() too much when
 * the fifo queue is empty.
 */
async function process_get_orders_loop() {
  if (!fifo_queue_is_empty()) {
    const my_command = dequeue_from_fifo_queue();
    try {
      await process_a_single_get_orders(my_command);
    } catch (error) {
      console.error(error.stack);
      console.error('process a single get orders failed');
    }
  }
  clearTimeout(process_get_orders_timeout);
  process_get_orders_timeout = setTimeout(process_get_orders_loop, PROCCES_COMMANDS_INTERVAL);
}

/**
 * Returns milliseconds to sleep depending on retries left.
 * Done.
 */
function how_long_to_sleep(retries_left = 0) {
  switch (retries_left) {
    case 10:
      return 1_000;

    case 9:
      return 2_000;

    case 8:
      return 4_000;

    case 7:
      return 8_000;

    case 6:
      return 16_000;

    case 5:
      return 32_000;

    case 4:
      return 64_000;

    case 3:
      return 64_000;

    case 2:
      return 64_000;

    case 1:
      return 64_000;
    case 0:
      return 64_000;
    default:
      return 60_000;
  }
}

/**
 * Get and processes orders. Error out after it
 * has run out of retries.
 *
 * Done.
 *
 * @param {Command} the_command - a command object
 * @param {number} retry - an integer for how many retries we can attempt
 * @returns This returns when it's done getting orders, can
 * last a while if it's retrying multiple times.
 */
async function process_a_single_get_orders(the_command, retry = 10) {
  const contract_address = the_command.collection_address || '';
  const my_token_ids = the_command.token_ids;

  const query = {
    order_by: 'eth_price',
    token_ids: my_token_ids,
    order_direction: 'desc',
    side: 0,
    asset_contract_address: contract_address,
    limit: 50,
    offset: 0,
  };
  let orders;
  try {
    orders = await seaport.api.getOrders(query);
  } catch (error) {
    if (retry > 0) {
      const ms_to_sleep = how_long_to_sleep(retry);
      const retries_left = retry - 1;
      return sleep(ms_to_sleep)
        .then(() => process_a_single_get_orders(the_command, retries_left));
    }
    throw error;
  }
  // Don't await, be optimistic
  process_orders_to_send_bids(orders, the_command)
    .catch((e) => {
      console.log(e.stack);
      console.log('processing orders to send bids failed for some reason ¯\\_(ツ)_/¯');
    })
  return undefined;
}

async function process_orders_to_send_bids(the_orders, the_command) {
  const tokenIdToTopOrderDict = {};
  const orderArr = the_orders?.orders || [];
  const token_ids_checked = the_command.token_ids || [];

  const contract_address = the_command.collection_address;
  // Only builds tokenIdToTopOrderDict
  for (const o of orderArr) {
    console.log(`tokenId: ${o?.asset?.tokenId}, ${o.makerAccount?.address} bid: ${o.currentPrice / 1e18}`);
    if (o?.asset?.tokenId === undefined) { continue; } // skip if theres no tokenId
    if (o?.asset?.tokenId in tokenIdToTopOrderDict) { continue; } // top bid already found
    if (!(o.paymentTokenContract.symbol === 'WETH' || o.paymentTokenContract.symbol === 'ETH')) { continue; }

    tokenIdToTopOrderDict[o?.asset?.tokenId] = {
      address: o?.makerAccount?.address?.toLowerCase(),
      topBid: o.currentPrice / 1e18,
      expirationTime: o.expirationTime,
    }
  }

  // Send top bids to machines
  for (const key in tokenIdToTopOrderDict) {
    if (blacklist.has(tokenIdToTopOrderDict[key].address)
    && tokenIdToTopOrderDict[key].expirationTime - Math.floor(+new Date()) / 1000 > 180) {
      console.log(`We are top bid ${the_command.slug} : id: ${key}, ${tokenIdToTopOrderDict[key].topBid}`);
    } else {
      console.log(`sending => top: ${tokenIdToTopOrderDict[key].topBid}, token_id:${key}, slugs: ${the_command.slug}`);
      redis_handler.redis_push(which_queue, {
        token_id: key,
        token_address: contract_address,
        slug: the_command.slug,
        event_type: 'focus',
        bid_amount: tokenIdToTopOrderDict[key].topBid,
        tier: the_command.tier || '',
      })
        .catch((e) => console.log(e.stack))
      // registerBidAttempted(slug, key);
      // TODO: figure out how to register the bid attempt here. idea: use redis
    }
  }
  // Place min bid on assets that we found not top bids for.
  for (const token_id of token_ids_checked) {
    const no_top_bid_found = !(token_id in tokenIdToTopOrderDict);
    if (no_top_bid_found) {
      redis_handler.redis_push(which_queue, {
        token_id,
        token_address: contract_address,
        slug: the_command.slug,
        event_type: 'focus',
        bid_amount: 0.001,
        tier: the_command?.tier || '',
      })
        .catch((e) => console.log(e.stack))
    }
  }
}

/**
 * Seemingly done.
 * TODO: Double check if theres anything left to add.
 */
async function start() {
  await watchlistupdater.startLoop();
  await set_up_blacklist();
  console.log('STARTING GET ORDERS QUEUE')
  get_command_loop();
  process_get_orders_loop();
}

// The following are all the fifo queue
// commands that we need. We can update the
// underlying data structure used for this fifo
// if performance becomes and issue. For now
// we will use simply an array. O(1) enqueue.
// O(N) dequeue. Max len likely to be 15.
// So worst case to dequeue 15 items in
// a row while allowing more inserts is
// (15 * 15) operations.

function enqueue_onto_fifo_queue(element) {
  fifo_queue.push(element);
}

function dequeue_from_fifo_queue() {
  return fifo_queue.shift();
}

function fifo_queue_is_empty() {
  return fifo_queue.length === 0;
}

function get_fifo_queue_length() {
  return fifo_queue.length;
}

let our_wallets;
let our_addresses;

async function set_up_blacklist() {
  our_wallets = await mongo_handler.get_our_wallets()
  our_addresses = our_wallets.map(({ address }) => address.toLowerCase())
  blacklist = new Set(our_addresses);
}
module.exports = { start }

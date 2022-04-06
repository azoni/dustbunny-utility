/* eslint-disable prefer-destructuring */
/* eslint-disable no-param-reassign */
const node_redis = require('redis')
const mongo = require('../AssetsMongoHandler.js')
const watchlistupdater = require('../utility/watchlist_retreiver.js');

let watch_list;
const blacklist_wallets = ['0x4d64bDb86C7B50D8B2935ab399511bA9433A3628', '0x18a73AaEe970AF9A797D944A7B982502E1e71556', '0x1AEc9C6912D7Da7a35803f362db5ad38207D4b4A', '0x35C25Ff925A61399a3B69e8C95C9487A1d82E7DF']
for (const w in blacklist_wallets) {
  blacklist_wallets[w] = blacklist_wallets[w].toLowerCase()
}
const client = node_redis.createClient({
  url: 'redis://10.0.0.80:6379',
});

async function start_connection() {
  client.connect();
  client.on('error', (err) => console.log('Redis Client Error', err));
  await watchlistupdater.startLoop();
  watch_list = watchlistupdater.getWatchList();
}

async function dump_queue(queue_name) {
  console.log(await client.LLEN(`queue:${queue_name}`))
  client.DEL(`queue:${queue_name}`)
  console.log(`${queue_name} queue dumped`)
}

async function print_queue_length(queue_name) {
  console.log(`Queue ${queue_name}: ${await client.LLEN(`queue:${queue_name}`)}`)
}

async function get_queue_length(queue_name) {
  return client.LLEN(`queue:${queue_name}`)
}

async function redis_push(queue_name, asset) {
  try {
    if (!asset.traits) {
      const mongo_traits = await mongo.findOne({ slug: asset.slug, token_id: asset.token_id })
      // eslint-disable-next-line no-param-reassign
      asset.traits = mongo_traits.traits
    }
  } catch (e) {
    console.log('No traits on asset.')
  }
  watch_list = watchlistupdater.getWatchList();
  const watchListCollection = watch_list.find(({ address }) => address === asset.token_address);
  if (watchListCollection === undefined || watchListCollection.tier === 'skip' || (blacklist_wallets.includes(asset.owner_address))) {
    // console.log('already top bid')
    return
  }
  try {
    // eslint-disable-next-line no-param-reassign
    asset.tier = watchListCollection.tier;
  } catch (e) {
    console.log(asset.slug)
  }
  let min_range = 0.61
  let max_range = 0.81
  if (asset.tier) {
    if (asset.tier === 'medium') {
      min_range = 0.66
      max_range = 0.86
    } else if (asset.tier === 'high') {
      min_range = 0.71
      max_range = 0.925
    } else if (asset.tier === 'low') {
      min_range = 0.61
      max_range = 0.81
    } else if (asset.tier === 'medium-low') {
      min_range = 0.685
      max_range = 0.835
    }
  }
  // eslint-disable-next-line no-param-reassign
  asset.bid_range = [min_range, max_range]
  const traits = await mongo.read_traits(asset.slug)
  try {
    if (traits) {
      const collection_traits = traits.traits
      let reduce = false
      for (const trait of asset.traits) {
        if (collection_traits[trait.trait_type.toLowerCase()]) {
          if (collection_traits[trait.trait_type.toLowerCase()][trait.value.toLowerCase()]) {
            const range = collection_traits[trait.trait_type
              .toLowerCase()][trait.value.toLowerCase()]
            if (range === 'reduce') {
              reduce = true
            }
            if (!asset.bid_range) {
              asset.bid_range = range
              asset.trait = trait.value
            }
            if (range[1] > asset.bid_range[1]) {
              asset.trait = trait.value
              asset.bid_range = range
            }
          }
        }
      }
      if (reduce) {
        asset.bid_range[0] -= 0.1
        asset.bid_range[1] -= 0.1
      }
    }
  } catch (e) {
    console.log(e.message)
    console.log('Asset doesnt exist')
  }
  if (watchListCollection.db_range && !asset.trait) {
    asset.bid_range = watchListCollection.db_range
  }
  if (asset.bid_amount) {
    min_range = asset.bid_range[0]
    max_range = asset.bid_range[1]
    const collection_stats = await client.GET(`${asset.slug}:stats`)
    const data = JSON.parse(collection_stats)
    if (!data) {
      console.warn(`Collection stats for asset: ${asset.slug} missing`);
      return;
    }
    const { floor_price } = data
    const fee = data.dev_seller_fee_basis_points / 10000
    if (floor_price < 0.3) {
      return
    }
    if (asset.bid_amount > floor_price * (max_range - fee) && !asset.bypass_max) {
      console.log(`TOO HIGH ${asset.bid_amount.toFixed(2)} ${floor_price} ${asset.slug} ${asset.token_id} ${asset.trait}`)
      return
    }
    if (asset.bid_amount < floor_price * (min_range - fee)) {
      asset.bid_amount = floor_price * (min_range - fee)
    }
  }

  await client.rPush(`queue:${queue_name}`, JSON.stringify(asset));
}

async function redis_push_asset(asset) {
  await client.rPush('queue:manual', JSON.stringify(asset));
}

async function redis_push_asset_flash(asset) {
  await client.rPush('queue:flash', JSON.stringify(asset));
}

async function push_asset_high_priority(asset) {
  await client.rPush('queue:high', JSON.stringify(asset));
}

async function redis_command_pop(which='') {
  const data = await client.lPopCount(`focus:commands${which}`, 30);
  return data;
}

async function redis_push_command(command, which = '') {
  return client.rPush(`focus:commands${which}`, JSON.stringify(command));
}

// http method - client pull
async function redis_queue_pop() {
  const pop_count = 2

  const high_queue_data = await client.lPopCount('queue:high', pop_count)
  if (high_queue_data !== null && high_queue_data !== undefined && high_queue_data.length > 0) {
    return high_queue_data
  }
  const rare_queue_data = await client.lPopCount('queue:rare', pop_count)
  if (rare_queue_data !== null && rare_queue_data !== undefined && rare_queue_data.length > 0) {
    return rare_queue_data
  }
  const listed_queue_data = await client.lPopCount('queue:listed', pop_count)
  if (listed_queue_data !== null && listed_queue_data !== undefined
    && listed_queue_data.length > 0) {
    return listed_queue_data
  }
  const transfer_queue_data = await client.lPopCount('queue:transfer', pop_count)
  if (transfer_queue_data !== null && transfer_queue_data !== undefined
    && transfer_queue_data.length > 0) {
    return transfer_queue_data
  }
  const staking_queue_data = await client.lPopCount('queue:staking', pop_count)
  if (staking_queue_data !== null && staking_queue_data !== undefined
    && staking_queue_data.length > 0) {
    return staking_queue_data
  }
  const collection_queue_data = await client.lPopCount('queue:collection', pop_count)
  if (collection_queue_data !== null && collection_queue_data !== undefined
    && collection_queue_data.length > 0) {
    return collection_queue_data
  }
  const flash_queue_data = await client.lPopCount('queue:flash', pop_count)
  if (flash_queue_data !== null && flash_queue_data !== undefined && flash_queue_data.length > 0) {
    return flash_queue_data
  }
  const manual_queue_data = await client.lPopCount('queue:manual', pop_count)
  if (manual_queue_data !== null && manual_queue_data !== undefined
    && manual_queue_data.length > 0) {
    return manual_queue_data
  }

  const smart_queue_data = await client.lPopCount('queue:smart', pop_count)
  if (smart_queue_data !== null && smart_queue_data !== undefined && smart_queue_data.length > 0) {
    return smart_queue_data
  }
  return client.lPopCount('queue:flash', pop_count)
}

module.exports = {
  redis_push_command,
  redis_command_pop,
  client,
  start_connection,
  redis_push,
  print_queue_length,
  dump_queue,
  push_asset_high_priority,
  redis_push_asset,
  redis_queue_pop,
  get_queue_length,
  redis_push_asset_flash,
};

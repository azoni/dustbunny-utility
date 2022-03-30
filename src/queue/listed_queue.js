const opensea_handler = require('../handlers/opensea_handler.js')
const redis_handler = require('../handlers/redis_handler.js')
const utils = require('../utility/utils.js')
const mongo = require('../AssetsMongoHandler.js')
const watchlistupdater = require('../utility/watchlist_retreiver.js');

let bids_added = 0

async function listed_queue_add(event_type, exp, bid) {
  const time_window = 3000
  const start_time = Math.floor(+new Date())
  const watch_list = watchlistupdater.getWatchList();
  console.log('Getting listings...')
  const orders = await opensea_handler.get_listed_lowered(time_window);

  bids_added = 0
  for (const o of orders) {
    try {
      const asset = {}
      if (o.asset === undefined) {
        // eslint-disable-next-line no-continue
        continue
      }
      asset.token_id = o.asset.tokenId
      asset.token_address = o.asset.tokenAddress
      asset.slug = o.asset.collection.slug
      const watchListCollection = watch_list.find(({ address }) => address === asset.token_address);
      if (watchListCollection !== undefined) {
        asset.tier = watchListCollection.tier;
        asset.fee = o.asset.collection.devSellerFeeBasisPoints / 10000
        asset.event_type = event_type
        asset.expiration = 0.25
        asset.listed_price = o.basePrice / 1000000000000000000
        console.log(asset)
        const mongo_traits = await mongo.findOne({ slug: asset.slug, token_id: asset.token_id })
        asset.traits = mongo_traits.traits
        if (exp !== '') {
          asset.expiration = exp / 60
        }
        bids_added += 1
        const command = {
          hash: `${asset.slug}:${asset.token_id}`,
          slug: asset.slug,
          collection_address: asset.token_address,
          token_ids: [asset.token_id],
          time_suggestion: 300 * 60_000,
        }
        redis_handler.redis_push(event_type, asset);
        const focus_list = ['boredapeyachtclub']// , 'bored-ape-kennel-club', 'doodles-official', 'mutant-ape-yacht-club', 'azuki', 'cloneX']
        if (focus_list.includes(asset.slug)) {
          redis_handler.redis_push_command(command)
        }
      }
    } catch (e) {
      console.log(e)
    }
  }
  await redis_handler.print_queue_length(event_type)
  console.log(`bids added: ${bids_added}`)
  const queue_length = await redis_handler.get_queue_length(event_type)
  const end_time = Math.floor(+new Date())
  if (end_time - start_time < time_window) {
    const wait_time = time_window - (end_time - start_time)
    console.log(`Queue ${event_type}: ${queue_length}`)
    console.log(`waiting: ${wait_time}ms`)
    await utils.sleep(wait_time)
  }
  listed_queue_add(event_type, exp, bid)
}

async function start() {
  await watchlistupdater.startLoop();
  listed_queue_add('listed', 15, false)
}

module.exports = { start, listed_queue_add };

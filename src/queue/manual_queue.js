const opensea_handler = require('../handlers/opensea_handler.js')
const redis_handler = require('../handlers/redis_handler.js')
const utils = require('../utility/utils.js')
const mongo = require('../AssetsMongoHandler.js')

// Grab assets from database to avoid api rate limits.
async function manual_queue_add(slug, event_type, exp, bid, run_traits) {
  console.log(`Getting assets for ${slug}...`)
  // var assets =  await opensea_handler.get_assets(slug)
  let query = { slug }
  if (run_traits === 'single') {
    console.log('finding single trait')
    query = { slug: 'metroverse-genesis', traits: { $elemMatch: { value: 'Circ-o-verse', trait_type: 'Buildings: Commercial' } } }
  }
  const assets = await mongo.find(query, {})
  // let collection_traits = trait_bids[slug]
  const mongo_traits = await mongo.read_traits(slug)
  let collection_traits = false
  try {
    collection_traits = mongo_traits.traits
    console.log(`Trait bids: ${collection_traits}`)
  } catch (e) {
    console.log('No traits found.')
  }
  console.log(`assets: ${assets.length}`)
  for (const asset of assets) {
    const trimmed_asset = {}
    trimmed_asset.token_id = asset.token_id
    trimmed_asset.traits = asset.traits
    trimmed_asset.token_address = asset.token_address
    trimmed_asset.slug = asset.slug
    trimmed_asset.fee = asset.dev_seller_fee_basis_points / 10000
    trimmed_asset.event_type = event_type
    trimmed_asset.expiration = exp

    if (trimmed_asset.trait && run_traits === 'skip') {
      // eslint-disable-next-line no-continue
      continue
    }
    if (!trimmed_asset.trait && run_traits === 'only') {
      // eslint-disable-next-line no-continue
      continue
    }
    trimmed_asset.bidding_adress = '0xd517e2ACDFBBb19BcC3c7069dDDeE2D67Eab4E6c'
    trimmed_asset.bid_amount = 0.85
    trimmed_asset.bypass_max = true
    await redis_handler.redis_push(event_type, trimmed_asset)
  }
  await redis_handler.print_queue_length(event_type)
  console.log(`${slug} added.`)
}
let wallet_set;

// No traits from orders :(
async function get_competitor(address, time_window, exp) {
  const start_time = Math.floor(+new Date())
  const orders = await opensea_handler.get_orders_window(address, time_window)
  console.log(`Getting orders for ${address}...`)
  for (const o of orders) {
    const asset = {}

    asset.token_id = o.asset.tokenId
    asset.token_address = o.asset.tokenAddress
    asset.slug = o.asset.collection.slug
    asset.fee = o.asset.collection.devSellerFeeBasisPoints / 10000
    asset.event_type = 'competitor'
    asset.expiration = false
    if (exp !== '') {
      asset.expiration = exp / 60
    }
    asset.bid_multi = false
    asset.bid_amount = o.basePrice / 1000000000000000000
    if (wallet_set.includes(asset.slug)) {
      // console.log(asset)
      await redis_handler.redis_push_asset(asset)
      // await redis_handler.print_queue_length('manual')
    }
  }
  const end_time = Math.floor(+new Date())
  if (end_time - start_time < time_window) {
    const wait_time = time_window - (end_time - start_time)
    await utils.sleep(wait_time)
  }
  get_competitor(address, time_window, exp)
}

// eslint-disable-next-line no-unused-vars
async function manual_queue_start() {
  await redis_handler.print_queue_length('manual')
  // eslint-disable-next-line global-require
  const readline = require('readline-sync')
  const slug = readline.question('collection: ')
  if (slug === 'comp') {
    const address = readline.question('address: ')
    const time_window = readline.question('window: ')
    const exp = readline.question('expire: ')
    get_competitor(address, time_window * 1000, exp)
  }
  manual_queue_add(slug, 'manual')
}
async function start() {
  // eslint-disable-next-line global-require
  const readline = require('readline-sync')
  const slug = readline.question('slug: ')
  let exp = readline.question('exp: ')
  let run_traits = readline.question('traits: ')
  let bid = ''// readline.question('bid: ')
  if (exp === '') {
    exp = 20
  }
  if (bid === '') {
    bid = false
  }
  if (run_traits === '') {
    run_traits = false
  }
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const start_time = Math.floor(+new Date())
    await manual_queue_add(slug, 'manual', exp / 60, bid, run_traits)
    // await utils.sleep(exp*60000)
    const end_time = Math.floor(+new Date())
    if (end_time - start_time < exp * 60000) {
      const wait_time = exp * 60000 - (end_time - start_time)
      console.log(`waiting: ${(wait_time / 60000).toFixed(2)}min`)
      exp = wait_time / 60000
      await utils.sleep(wait_time)
    }
  }
}
module.exports = { start, get_competitor, manual_queue_add };

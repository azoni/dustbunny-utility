/* eslint-disable global-require */
const redis_handler = require('../handlers/redis_handler.js')
const mongo = require('../AssetsMongoHandler.js')
const utils = require('../utility/utils.js')
const opensea_handler = require('../handlers/opensea_handler.js')

async function trait_floor(assets) {
  const token_ids = []
  const asset_contract_address = assets[0].token_address
  let temp_30_array = []
  let asset_count = 0
  for (const asset of assets) {
    temp_30_array.push(asset.token_id)
    if (temp_30_array.length === 30) {
      token_ids.push(temp_30_array)
      temp_30_array = []
    }
    if (asset_count === assets.length) {
      token_ids.push(temp_30_array)
    }
    asset_count += 1
  }
  const ordered_listings = []
  const asset_listings = {}
  for (const token_array of token_ids) {
    await utils.sleep(500)
    const orders = await opensea_handler
      .get_orders_window(asset_contract_address, false, token_array, 1)
    // console.log(`order length: ${orders.length}`)
    for (const o of orders) {
      const listing_price = o.currentPrice / 1000000000000000000
      // console.log(`${o.asset.tokenId} ${listing_price}`)
      if (!asset_listings[o.asset.tokenId]) {
        ordered_listings.push(listing_price)
        asset_listings[o.asset.tokenId] = [listing_price]
      } else {
        asset_listings[o.asset.tokenId].push(listing_price)
      }
    }
  }
  // console.log(ordered_listings.length)
  const trait_floor_prices = ordered_listings.sort((a, b) => a - b).slice(0, 2)
  // console.log(`Trait floor: ${trait_floor_prices}`)
  return trait_floor_prices
  // for (const l in asset_listings) {
  //   console.log(`${l} ${asset_listings[l]}`)
  // }
}

// Grab assets from database to avoid api rate limits.
async function add_trait_queue(slug, exp) {
  console.log(`Getting assets for ${slug}...`)
  let counter = 0
  const traits = await mongo.read_traits(slug)
  const assets = []
  console.log(traits.traits)
  // eslint-disable-next-line prefer-const
  let traits_dict = traits.traits
  // const single_property = {}
  // const single_trait = {}
  // single_trait.trippy = traits_dict.fur.trippy
  // single_property.fur = single_trait
  // console.log(single_property)
  // traits_dict = single_property
  for (const trait in traits_dict) {
    for (const t in traits_dict[trait]) {
      const query = { slug, traits: { $elemMatch: { value: { $regex: t, $options: 'i' }, trait_type: { $regex: trait, $options: 'i' } } } }
      const temp_assets = await mongo.find(query, { $caseSensitive: false })
      const collection_stats = await redis_handler.client.GET(`${slug}:stats`)
      const data = JSON.parse(collection_stats)
      const { floor_price } = data
      const fee = data.dev_seller_fee_basis_points / 10000
      const bid_range = traits_dict[trait][t]
      const min = floor_price * (bid_range[0] - fee)
      const max = floor_price * (bid_range[1] - fee)
      try {
        let trait_floor_price = await trait_floor(temp_assets)
        if (trait_floor_price.length === 0) {
          trait_floor_price = ['None']
        }
        console.log(`${trait} ${t} num: ${temp_assets.length} min: ${min.toFixed(2)} max: ${max.toFixed(2)} floor: ${trait_floor_price.join(', ')}`)
      } catch (e) {
        console.log(temp_assets)
      }
      for (const a of temp_assets) {
        assets.push(a)
      }
    }
  }
  const readline = require('readline-sync')
  const confirm = readline.question('confirm: ')
  if (confirm !== 'confirm') {
    return
  }
  console.log('adding to queue...')
  for (const asset of assets) {
    const trimmed_asset = {}
    trimmed_asset.token_id = asset.token_id
    trimmed_asset.traits = asset.traits
    trimmed_asset.token_address = asset.token_address
    trimmed_asset.slug = asset.slug
    trimmed_asset.event_type = 'trait'
    trimmed_asset.expiration = exp
    // trimmed_asset.bidding_adress = '0xb56851362dE0f360E91e5F52eC64d0A1D52E98E6'

    await redis_handler.redis_push('collection', trimmed_asset)
    counter += 1
  }
  await redis_handler.print_queue_length('collection')
  console.log(`${counter} ${slug} added.`)
}

async function start() {
  // eslint-disable-next-line global-require
  // const readline = require('readline-sync')
  let slug = process.argv[3] // readline.question('slug: ')
  if (slug === 'bayc') {
    slug = 'boredapeyachtclub'
  }
  const exp = process.argv[4] // readline.question('exp: ')
  add_trait_queue(slug, exp / 60)
}
module.exports = { start, add_trait_queue };

/* eslint-disable no-continue */
/* eslint-disable no-param-reassign */
const mongo_handler = require('./handlers/mongo_handler.js')
const redis_handler = require('./handlers/redis_handler.js')
const opensea_handler = require('./handlers/opensea_handler.js')
const utils = require('./utility/utils.js')

// Trait matching code taken from redis push.
async function get_trait_bid(asset) {
  if (!asset.traits) {
    const mongo_traits = await mongo_handler.findOne({ slug: asset.slug, token_id: asset.token_id })
    // eslint-disable-next-line no-param-reassign
    asset.traits = mongo_traits.traits
  }
  const traits = await mongo_handler.read_traits(asset.slug)
  asset.bid_range = [0.4, 0.6]
  try {
    if (traits) {
      const collection_traits = traits.traits
      for (const trait of asset.traits) {
        if (collection_traits[trait.trait_type.toLowerCase()]) {
          if (collection_traits[trait.trait_type.toLowerCase()][trait.value.toLowerCase()]) {
            const range = collection_traits[trait.trait_type
              .toLowerCase()][trait.value.toLowerCase()]

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
      // Return max bid range, updated if trait found otherwise uses default.
      return asset.bid_range[1]
    }
  } catch (e) {
    console.log(e.message)
    console.log('Asset doesnt exist')
    return false
  }
  return false
}

// Function to see if an asset is worth buying based on listed price.
async function check_if_worth(asset, listed_price, max_buy_range) {
  // Floor data to determine buy price.
  const collection_stats = await redis_handler.client.GET(`${asset.slug}:stats`)
  const data = JSON.parse(collection_stats)
  if (!data) {
    console.warn(`Collection stats for asset: ${asset.slug} missing`);
    return false
  }
  const { floor_price } = data
  const fee = data.dev_seller_fee_basis_points / 10000

  // Our max buy calculation.
  const our_max_buy = floor_price * (max_buy_range - fee)
  console.log(`Calculation - Floor:${floor_price.toFixed(3)} * Trait Value:(${max_buy_range} - Fee:${fee}) = Max Buy:${our_max_buy.toFixed(3)}`)
  console.log(`Listed price: ${listed_price}`)

  // Return true if asset is worth buying.
  if (listed_price < our_max_buy) {
    return true
  }
  return false
}

async function run() {
  console.log('Starting...')

  // Start mongo and redis connections.
  await mongo_handler.connect()
  await redis_handler.start_connection()

  // Run check on a loop.
  while (true) {
    // Get listings.
    const token_id = await redis_handler.redis_pop_listing_to_purchase()

    // If queue is empty wait a bit and check again.
    if (token_id === null) {
      console.log('Queue empty...')
      await utils.sleep(500)
      continue
    }
    // asset object created using token id passed from redis listing to purchase.
    const asset = {
      slug: 'beanzofficial',
      token_address: '0x306b1ea3ecdf94ab739f1910bbda052ed4a9f949',
      token_id,
    }
    // Get max buy range for most desired trait on the asset.
    const max_buy_range = await get_trait_bid(asset)

    // OpenSea Handler to get sell order for a single asset.
    const sell_order = await opensea_handler.get_single_listed(asset)
    if (sell_order) {
      const listed_price = sell_order.basePrice / 1000000000000000000

      // Check if listed asset is worth buying.
      const is_worth = await check_if_worth(asset, listed_price, max_buy_range)

      // If check_if_worth returns true then submit asset to be purchased.
      if (is_worth) {
        console.log(`Adding ${asset.token_id} to buy queue!!!`)
        redis_handler.redis_push_listing_to_buy(sell_order)
      }
    }
  }
}
run()

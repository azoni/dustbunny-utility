// grab rares from data and throw into priority high queue if a bid is detected
const data_node = require('../data_node.js')
const opensea_handler = require('../handlers/opensea_handler.js')
const utils = require('../utility/utils.js')
const mongo = require('../AssetsMongoHandler.js')
const redis_handler = require('../handlers/redis_handler.js')

// getOrders on 30 token IDs at once, possibly match expiration
const collections = []
const trait_bids = data_node.COLLECTION_TRAIT
async function start_listener() {
  const start_time = Math.floor(+new Date())
  const exp = 30
  for (const collection of collections) {
    console.log(collection.token_ids)
    await utils.sleep(500)
    for (const token_array of collection.token_ids) {
      await utils.sleep(500)
      const orders = await opensea_handler
        .get_orders_window(collection.asset_contract_address, 30000, token_array)
      console.log(`Getting orders for ${collection.slug}...`)
      for (const o of orders) {
        const asset = {}

        asset.token_id = o.asset.tokenId
        asset.token_address = o.asset.tokenAddress
        asset.slug = o.asset.collection.slug
        asset.fee = o.asset.collection.devSellerFeeBasisPoints / 10000
        asset.event_type = 'rare'
        asset.expiration = false
        if (exp !== '') {
          asset.expiration = exp / 60
        }
        const mongo_traits = await mongo.findOne({ slug: asset.slug, token_id: asset.token_id })
        asset.traits = mongo_traits.traits
        for (const trait of asset.traits) {
          const collection_traits = trait_bids[asset.slug]
          if (collection_traits !== undefined && collection_traits[trait.trait_type
            .toLowerCase()]) {
            if (collection_traits[trait.trait_type.toLowerCase()][trait
              .value.toLowerCase()]) {
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
        if (asset.trait === undefined) {
          // eslint-disable-next-line no-continue
          continue
        }
        // asset['bid_amount'] = o.basePrice/1000000000000000000
        console.log(o.expirationTime - Math.floor(+new Date()) / 1000)
        console.log(`${asset.slug} ${asset.token_id} ${o.basePrice / 1000000000000000000} ${asset.trait} ${asset.bid_range}`)
        await redis_handler.redis_push('rare', asset)
      }
    }
  }

  const end_time = Math.floor(+new Date())
  if (end_time - start_time < 30000) {
    const wait_time = 30000 - (end_time - start_time)
    console.log(`waiting: ${wait_time}ms`)
    await utils.sleep(wait_time)
  }
  start_listener()
}
async function start() {
  let token_ids = []
  let assets = await mongo.find({ slug: 'doodles-official', 'traits.trait_type': 'face', 'traits.value': 'rainbow puke' }, {})
  let assets2 = await mongo.find({ slug: 'doodles-official', 'traits.trait_type': 'face', 'traits.value': 'shark' }, {})
  let assets3 = await mongo.find({ slug: 'doodles-official', 'traits.trait_type': 'face', 'traits.value': 'puffer up' }, {})
  const assets4 = await mongo.find({ slug: 'doodles-official', 'traits.trait_type': 'face', 'traits.value': 'ape' }, {})

  let arr = [...assets, ...assets2, ...assets3, ...assets4];
  console.log(arr.length)
  let asset_contract_address = assets[0].token_address
  let temp_30_array = []
  let asset_count = 0
  for (const asset of arr) {
    asset_count += 1
    temp_30_array.push(asset.token_id)
    if (temp_30_array.length === 30) {
      token_ids.push(temp_30_array)
      temp_30_array = []
    }
    if (asset_count === arr.length) {
      token_ids.push(temp_30_array)
    }
  }
  const doodles_dict = {}
  doodles_dict.asset_contract_address = asset_contract_address
  doodles_dict.token_ids = token_ids
  doodles_dict.slug = 'doodles-official'
  collections.push(doodles_dict)

  token_ids = []
  assets = await mongo.find({ slug: 'mutant-ape-yacht-club', 'traits.trait_type': 'Fur', 'traits.value': 'M1 Solid Gold' }, {})
  assets2 = await mongo.find({ slug: 'mutant-ape-yacht-club', 'traits.trait_type': 'Fur', 'traits.value': 'M2 Solid Gold' }, {})
  assets3 = await mongo.find({ slug: 'mutant-ape-yacht-club', 'traits.trait_type': 'Fur', 'traits.value': 'M2 Trippy' }, {})
  arr = [...assets, ...assets2, ...assets3];
  console.log(arr.length)
  asset_contract_address = assets[0].token_address
  temp_30_array = []
  asset_count = 0
  for (const asset of arr) {
    asset_count += 1
    temp_30_array.push(asset.token_id)
    if (temp_30_array.length === 30) {
      token_ids.push(temp_30_array)
      temp_30_array = []
    }
    if (asset_count === arr.length) {
      token_ids.push(temp_30_array)
    }
  }
  const mayc_dict = {}
  mayc_dict.asset_contract_address = asset_contract_address
  mayc_dict.token_ids = token_ids
  mayc_dict.slug = 'mutant-ape-yacht-club'
  collections.push(mayc_dict)

  start_listener()
}
// start_listener()
module.exports = { start, start_listener };

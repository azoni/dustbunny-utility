const data_node = require('../data_node.js')
const redis_handler = require('../handlers/redis_handler.js')
const utils = require('../utility/utils.js')
const opensea_handler = require('../handlers/opensea_handler.js')
const mongo = require('../AssetsMongoHandler.js')
// const mongo_handler = require('../handlers/mongo_handler.js')

let bids_added = 0

async function get_competitor_bids(type, exp) {
  // const flash_wallets = await mongo_handler.get_flash_wallets()
  // flash ten, 11
  const wallet_orders = ['0x41f01d8F02c569be620E13c9b33CE803BeD84e90', '0x26054c824ff0a6225dFA24a1EebD6A18dE6b5f7d', '0xDE7E81F4587456C49f4ceAb92FbD48c96e60C6d2', '0x045e1c6b9a5c486e9Ee36ed510A0ff2577A24a1d', '0xEf66b4871069ed10D64220F9D77443bBBA264BB3'] // flash_wallets.map(({ address }) => address.toLowerCase())
  const time_window = wallet_orders.length * 2000
  const start_time = Math.floor(+new Date())
  console.log(`${'Adding to queue... event widnow: '}${time_window}`)

  const queue_length = await redis_handler.get_queue_length(type)

  bids_added = 0
  for (const address of wallet_orders) {
    await utils.sleep(250)
    const orders = await opensea_handler.get_orders_window(address, time_window)
    try {
      for (const o of orders) {
        const asset = {}
        asset.token_id = o.asset.tokenId
        asset.token_address = o.asset.tokenAddress
        asset.slug = o.asset.collection.slug
        asset.fee = o.asset.collection.devSellerFeeBasisPoints / 10000
        asset.event_type = type
        asset.expiration = 0.25
        if (exp !== '') {
          asset.expiration = exp / 60
        }
        let mongo_traits = await mongo.findOne({ slug: asset.slug, token_id: asset.token_id })
        if (mongo_traits === null) {
          // eslint-disable-next-line global-require
          const mongo_insert = require('../api_mongo_insert_to_db.js')
          await mongo_insert.add_asset(asset.slug, asset.token_address, asset.token_id)
          mongo_traits = await mongo.findOne({ slug: asset.slug, token_id: asset.token_id })
          console.log(`${asset.slug} ${asset.token_id} Added to DB.`)
        }
        try {
          asset.traits = mongo_traits.traits
        } catch (e) {
          console.log(asset)
        }
        if (data_node.PRIORITY_COMP_WALLET.includes(address)) {
          asset.bid_amount = o.basePrice / 1000000000000000000
          redis_handler.redis_push('high', asset);
        } else {
          if (queue_length < 1000) {
            asset.bid_amount = o.basePrice / 1000000000000000000
          }
          const allowed_slugs = ['doodles-official', 'cool-cats-nft', 'cyberkongz', 'mutant-ape-yacht-club', 'bored-ape-kennel-club', 'azuki', 'clonex', 'world-of-women-nft']
          if (allowed_slugs.includes(asset.slug)) {
            bids_added += 1
            redis_handler.redis_push('flash', asset);
          }
          // redis_handler.redis_push('flash', asset);
        }
      }
    } catch (ex) {
      console.log(ex.message)
    }
  }
  console.log(`bids added: ${bids_added}`)
  const end_time = Math.floor(+new Date())
  if (end_time - start_time < time_window) {
    const wait_time = time_window - (end_time - start_time)
    console.log(`Queue ${type}: ${queue_length}`)
    console.log(`waiting: ${wait_time}ms`)
    await utils.sleep(wait_time)
  }
  get_competitor_bids(type, exp)
}

async function flash_queue_start() {
  redis_handler.dump_queue('flash')
  // eslint-disable-next-line global-require
  const readline = require('readline-sync')
  let exp = readline.question('exp: ')
  if (exp === '') {
    exp = false
  }
  let type = readline.question('flash or high1, high2: ')
  if (type === 'high1' || type === 'high2') {
    if (type === 'high1') {
      // eslint-disable-next-line no-undef
      wallet_orders = data_node.PRIORITY_COMP_WALLET1
    } else if (type === 'high2') {
      // eslint-disable-next-line no-undef
      wallet_orders = data_node.PRIORITY_COMP_WALLET2
    }
    type = 'high'
  }
  get_competitor_bids(type, exp)
}

async function start() {
  flash_queue_start()
}
// start()
module.exports = { start, get_competitor_bids };

/* eslint-disable max-len */
const mongo_handler = require('./handlers/mongo_handler.js')
const redis_handler = require('./handlers/redis_handler.js')
const opensea_handler = require('./handlers/opensea_handler.js')
const etherscan_handler = require('./handlers/etherscan_handler.js')
const utils = require('./utility/utils.js')

async function get_watch_list() {
  const watch_list = await mongo_handler.readWatchList()
  let counter = 0
  const skip_list = ['skip']
  for (const collection of watch_list) {
    const collection_stats = await redis_handler.client.GET(`${collection.slug}:stats`)
    const data = JSON.parse(collection_stats)
    const { floor_price } = data
    // const { fee } = data
    if (!skip_list.includes(collection.tier) && floor_price > 0.5) {
      counter += 1
      console.log(collection.slug)
    }
  }
  console.log(`Count: ${counter}`)
}

// trait floors, erc20 tokens
async function main() {
  await mongo_handler.connect()
  await redis_handler.client.connect()
  if (process.argv[2] === 'watch') {
    await get_watch_list()
  } else if (process.argv[2] === 'wallet') {
    await display_wallet()
  } else if (process.argv[2] === 'dash') {
    await display_dashboard()
  }
}

async function display_dashboard() {
  let total_bids = 0
  let loops = 1
  // eslint-disable-next-line no-constant-condition
  const queue_names = ['high', 'listed', 'transfer', 'collection', 'flash', 'manual']
  let account1
  let account2
  let account1_eth
  let account2_eth
  let dustbunny_temp_length
  let dustbunny_18_temp_length

  while (true) {
    for (const name of queue_names) {
      await redis_handler.print_queue_length(name)
      const length = await redis_handler.get_queue_length(name)
      if (length > 500) {
        redis_handler.dump_queue(name)
      }
    }
    console.log()
    const orders = await opensea_handler.get_orders_window('0xB1CbED4ab864e9215206cc88C5F758fda4E01E25', 5000)
    await utils.sleep(250)
    const orders2 = await opensea_handler.get_orders_window('0x763be576919a0d32b9e7ebDaF5a858195E04A6Cb', 5000)
    total_bids += (orders.length + orders2.length) * 12

    console.log(`${(orders.length + orders2.length) * 12} bids per minute - Average bpm: ${(total_bids / loops).toFixed()}`)
    if ((orders.length + orders2.length) < 1) {
      console.log('Queues are empty.')
    }
    if ((orders.length + orders2.length) * 12 < 400 && (orders.length + orders2.length) > 0) {
      console.log('Bidding is currently slow.')
    } else if ((orders.length + orders2.length) === 0) {
      console.log('**NO BIDS BEING MADE**')
    }
    account1 = await etherscan_handler.get_weth_balance('0xB1CbED4ab864e9215206cc88C5F758fda4E01E25')
    account2 = await etherscan_handler.get_weth_balance('0x763be576919a0d32b9e7ebDaF5a858195E04A6Cb')
    account1_eth = await etherscan_handler.get_eth_balance('0xB1CbED4ab864e9215206cc88C5F758fda4E01E25')
    account2_eth = await etherscan_handler.get_eth_balance('0x763be576919a0d32b9e7ebDaF5a858195E04A6Cb')
    const dustbunny_assets = await get_wallet_value('0xB1CbED4ab864e9215206cc88C5F758fda4E01E25')
    await utils.sleep(250)
    const dustbunny_18_assets = await get_wallet_value('0x763be576919a0d32b9e7ebDaF5a858195E04A6Cb')
    if (loops === 1) {
      dustbunny_temp_length = dustbunny_assets.asset_count
      dustbunny_18_temp_length = dustbunny_18_assets.asset_count
    }

    if (dustbunny_assets.asset_count > dustbunny_temp_length) {
      console.log('================Dustbunny buy================')
      console.log('================Dustbunny buy================')
      console.log('================Dustbunny buy================')
    } else {
      dustbunny_temp_length = dustbunny_assets.asset_count
    }
    if (dustbunny_18_assets.asset_count > dustbunny_18_temp_length) {
      console.log('================Dustbunny_18 buy================')
      console.log('================Dustbunny_18 buy================')
      console.log('================Dustbunny_18 buy================')
    } else {
      dustbunny_18_temp_length = dustbunny_18_assets.asset_count
    }
    const total_value = account1_eth + account2_eth + account1 + account2 + (dustbunny_18_assets.listed_profit + dustbunny_assets.listed_profit)
    console.log(`DustBunny    - Eth: ${account1_eth.toFixed(2)} Weth: ${account1.toFixed(2)} NFTs: ${dustbunny_assets.asset_count} Value: ${dustbunny_assets.listed_profit.toFixed(2)}`)
    console.log(`DustBunny_18 - Eth: ${account2_eth.toFixed(2)} Weth: ${account2.toFixed(2)} NFTs: ${dustbunny_18_assets.asset_count} Value: ${dustbunny_18_assets.listed_profit.toFixed(2)}`)
    console.log(`Total        - Eth: ${(account1_eth + account2_eth).toFixed(2)} Weth: ${(account1 + account2).toFixed(2)} Total: ${total_value.toFixed(2)}`)
    console.log('-----------------------------------------------------')
    await utils.sleep(4500)
    loops += 1
  }
}

async function display_wallet() {
  let total_profit = 0
  let listed_total_profit = 0
  // 0xB1CbED4ab864e9215206cc88C5F758fda4E01E25 0x763be576919a0d32b9e7ebDaF5a858195E04A6Cb
  // const wallets = ['0xB1CbED4ab864e9215206cc88C5F758fda4E01E25', '0x763be576919a0d32b9e7ebDaF5a858195E04A6Cb']
  const wallets = ['0xf339dB5EF836A1bbD0A9F8E102f82e9f4dA8C8CA', '0xb56851362dE0f360E91e5F52eC64d0A1D52E98E6']
  for (const wallet of wallets) {
    const assets = await opensea_handler.get_assets_from_wallet(wallet)
    for (const asset in assets) {
      let asset_profit = 0
      let listed_asset_profit = 0
      const collection_stats = await redis_handler.client.GET(`${asset}:stats`)
      const data = JSON.parse(collection_stats)
      if (!data) {
        // eslint-disable-next-line no-continue
        continue
      }
      const after_fees = data.floor_price - data.floor_price
      * (data.dev_seller_fee_basis_points / 10000 + 0.025)
      console.log(`Count: ${assets[asset].length} Slug: ${asset} Floor: ${data.floor_price} Fee: ${data.dev_seller_fee_basis_points / 100}% = ${after_fees.toFixed(2)}`)
      for (const id of assets[asset]) {
        id.floor_profit = (after_fees - id.purchased)
        if (!id.listed_price) {
          id.listed_profit = 0
        } else {
          id.listed_profit = id.listed_price - id.listed_price * (data.dev_seller_fee_basis_points / 10000 + 0.025) - id.purchased
        }
        asset_profit += id.floor_profit
        listed_asset_profit += id.listed_profit
        id.floor_profit = (after_fees - id.purchased).toFixed(2)
        id.purchased = id.purchased.toFixed(3)
        id.listed_profit = id.listed_profit.toFixed(3)
        delete id.slug
      }
      console.log(assets[asset])
      console.log(`${asset} profit: ${asset_profit.toFixed(2)}`)
      console.log(`${asset} listed profit: ${listed_asset_profit.toFixed(2)}`)
      console.log()
      total_profit += asset_profit
      listed_total_profit += listed_asset_profit
    }
  }
  console.log(`Total profit: ${total_profit.toFixed(2)}`)
  console.log(`Total listed profit: ${listed_total_profit.toFixed(2)}`)
}
async function get_wallet_value(address) {
  let total_profit = 0
  let listed_total_profit = 0
  let length = 0
  const return_data = {}
  const assets = await opensea_handler.get_assets_from_wallet(address)
  for (const asset in assets) {
    let asset_profit = 0
    let listed_asset_profit = 0
    const collection_stats = await redis_handler.client.GET(`${asset}:stats`)
    const data = JSON.parse(collection_stats)
    if (!data) {
      // eslint-disable-next-line no-continue
      continue
    }
    const after_fees = data.floor_price - data.floor_price
    * (data.dev_seller_fee_basis_points / 10000 + 0.025)
    for (const id of assets[asset]) {
      length += 1
      id.floor_profit = (after_fees - id.purchased)
      if (!id.listed_price) {
        id.listed_profit = 0
      } else {
        id.listed_profit = id.listed_price * (1 - (data.dev_seller_fee_basis_points / 10000 + 0.025))
      }
      asset_profit += id.floor_profit
      listed_asset_profit += id.listed_profit
      id.floor_profit = (after_fees - id.purchased).toFixed(2)
      id.purchased = id.purchased.toFixed(3)
      id.listed_profit = id.listed_profit.toFixed(3)
      delete id.slug
    }

    // eslint-disable-next-line no-unused-vars
    total_profit += asset_profit
    listed_total_profit += listed_asset_profit
  }
  return_data.asset_count = length
  return_data.listed_profit = listed_total_profit
  return return_data
}

main()

/* eslint-disable default-param-last */
/* eslint-disable max-len */
const mongo_handler = require('./handlers/mongo_handler.js')
const redis_handler = require('./handlers/redis_handler.js')
const opensea_handler = require('./handlers/opensea_handler.js')
const etherscan_handler = require('./handlers/etherscan_handler.js')
const utils = require('./utility/utils.js')

async function main() {
  await mongo_handler.connect()
  await redis_handler.client.connect()
  if (process.argv[2] === 'watch') {
    await get_watch_list()
  } else if (process.argv[2] === 'wallet') {
    await display_wallet()
  } else if (process.argv[2] === 'bid-wallet') {
    await bid_on_wallet()
  } else if (process.argv[2] === 'dash') {
    await display_dashboard()
  } else if (process.argv[2] === 'focus') {
    add_focus(process.argv[3], process.argv[4])
  } else if (process.argv[2] === 'fill-listed') {
    await fill_listed_focus()
  } else if (process.argv[2] === 'fill-staking') {
    await fill_staking_focus()
  } else if (process.argv[2] === 'focus-listed') {
    add_focus_listed(process.argv[3], process.argv[4], process.argv[5])
  } else if (process.argv[2] === 'update-owners') {
    update_db_owners()
  } else if (process.argv[2] === 'add-int-trait') {
    add_int_traits_to_db()
  } else if (process.argv[2] === 'add-int-trait-match') {
    add_int_traits_match_to_db()
  } else if (process.argv[2] === 'add-match-trait') {
    add_traits_match_to_db()
  } else if (process.argv[2] === 'focus-dump') {
    dump_focus_by_name()
  } else if (process.argv[2] === 'dump') {
    redis_handler.dump_queue(process.argv[3])
  } else if (process.argv[2] === 'focus-len') {
    while (true) {
      const focus_keys = await redis_handler.client.keys('focus*')
      for (const key of focus_keys) {
        console.log(` ${key}: ${await redis_handler.client.LLEN(key)}`)
      }
      console.log('---------------')
      await utils.sleep(3000)
    }
  } else if (process.argv[2] === 'length') {
    await redis_handler.print_queue_length(process.argv[3])
  } else if (process.argv[2] === 'command-length') {
    const focus_keys = await redis_handler.client.keys('get_orders:*')
    for (const key of focus_keys) {
      console.log(` ${key}: ${await redis_handler.client.LLEN(key)}`)
    }
  } else if (process.argv[2] === 'find-flash') {
    find_flash()
  } else if (process.argv[2] === 'get-length') {
    display_length()
  } else {
    console.log('Invalid command.')
  }
}
async function get_watch_list() {
  const watch_list = await mongo_handler.readWatchList()
  let counter = 0
  const skip_list = ['skip']
  for (const collection of watch_list) {
    try {
      if (!skip_list.includes(collection.tier)) {
        const collection_stats = await redis_handler.client.GET(`${collection.slug}:stats`)
        const data = JSON.parse(collection_stats)
        const { floor_price } = data
        const { dev_seller_fee_basis_points } = data
        // const { fee } = data
        counter += 1
        if (collection.db_range) {
          const max_range = collection.db_range[1]
          const max_bid = floor_price * (max_range - dev_seller_fee_basis_points / 10000)
          console.log(`${collection.slug} max bid: ${max_bid.toFixed(5)} range: ${collection.db_range}`)
        } else if (collection.tier !== 'low') {
          console.log(`${collection.slug} ${collection.tier}`)
        }
      }
    } catch (e) {
      console.log(collection)
    }
  }
  console.log(`Count: ${counter}`)
}
async function bid_on_wallet() {
  let watch_list = await mongo_handler.readWatchList()
  watch_list = watch_list.map(({ slug }) => slug)
  const staking_wallets = await mongo_handler.readStakingWallets()
  const slugs_staking_wallets = staking_wallets.map(({ address }) => address.toLowerCase())
  const from = process.argv[3]
  if (!slugs_staking_wallets.includes(from)) {
    const assets_from = await get_assets_from_wallet(from)
    console.log(`${from}`)
    for (const asset in assets_from) {
      for (const id of assets_from[asset]) {
        if (watch_list.includes(id.slug)) {
          const time = 60
          const which_queue = 'high-focus'
          const command = {
            hash: `${id.slug}:${id.token_id}`,
            slug: id.slug,
            collection_address: id.token_address,
            token_ids: [id.token_id],
            time_suggestion: time * 60_000,
          }
          console.log(`${id.slug} ${id.token_id}`)
          redis_handler.redis_push_command(command, which_queue)
        }
      }
    }
  }
}

async function get_assets_from_wallet(wallet) {
  const assets = await opensea_handler.get_assets_from_wallet(wallet)
  return assets
}
async function display_length() {
  const queue_names = ['high', 'listed', 'transfer', 'collection', 'flash', 'manual']
  while (true) {
    for (const name of queue_names) {
      await redis_handler.print_queue_length(name)
      // const length = await redis_handler.get_queue_length(name)
      // if (length > 1000) {
      //   redis_handler.dump_queue(name)
      // }
    }
    console.log('----------------------')
    await utils.sleep(3000)
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
      // const length = await redis_handler.get_queue_length(name)
      // if (length > 1000) {
      //   redis_handler.dump_queue(name)
      // }
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
// eslint-disable-next-line no-unused-vars
async function get_blacklist() {
  const our_wallets = await mongo_handler.get_our_wallets()
  const our_addresses = our_wallets.map(({ address }) => address.toLowerCase())
  return new Set(our_addresses)
}
async function fill_listed_focus() {
  await add_focus_listed('boredapeyachtclub', 'high', 90)
  await add_focus_listed('mutant-ape-yacht-club', 'high', 90)
  // await add_focus_listed('azuki', 'medium', 'all')
  // await add_focus_listed('clonex', 'medium', 'all')
  // await add_focus_listed('doodles-official', 'medium', 'all')
}
async function fill_staking_focus() {
  // const staking_sets = await mongo_handler.readStakingWallets()
  // const slugs = staking_sets.map(({ slug }) => slug)
  const slugs1 = ['nft-worlds', 'metahero-generative', 'genesis-creepz', 'metroverse-genesis', 'metroverse-blackout', 'anonymice']
  const slugs2 = ['critterznft', 'llamaverse-genesis', 'thehabibiz', 'sappy-seals']
  // const slugs3 = ['critterznft', 'llamaverse-genesis', 'raidpartyfighters', 'thehabibiz']
  // const slugs4 = ['thehabibiz', 'ether-orcs', 'sappy-seals'] // , 'raidparty', 'sappy-seals']
  for (const slug of slugs1) {
    await add_focus(slug, 'staking')
  }
  for (const slug of slugs2) {
    await add_focus(slug, 'staking')
  }
  // for (const slug of slugs3) {
  //   if (slug === 'raidpartyfighters') {
  //     await add_focus(slug, 'staking3', true)
  //   } else {
  //     await add_focus(slug, 'staking3')
  //   }
  // }
  // for (const slug of slugs4) {
  //   await add_focus(slug, 'staking4')
  // }
  console.log('done')
}
async function add_focus_listed(slug, which = '', count) {
  console.log(`Adding to queue...${slug}`)
  const assets = await mongo_handler.find({ slug }, {})
  const token_ids = await create_token_ids_30(assets)
  const asset_contract_address = assets[0].token_address
  const asset_listings = {}
  let listing_count = 0
  for (const token_array of token_ids) {
    await utils.sleep(500)
    const orders = await opensea_handler
      .get_orders_window(asset_contract_address, false, token_array, 1)
    for (const o of orders) {
      const listing_price = o.currentPrice / 1000000000000000000
      // console.log(`${o.asset.tokenId} ${listing_price}`)
      if (o.paymentTokenContract.symbol !== 'ETH') {
        // eslint-disable-next-line no-continue
        continue
      }
      if (!asset_listings[o.asset.tokenId]) {
        listing_count += 1
        console.log(`${o.asset.tokenId} ${listing_count}`)
        asset_listings[o.asset.tokenId] = listing_price
      } else if (listing_price < asset_listings[o.asset.tokenId]) {
        asset_listings[o.asset.tokenId] = listing_price
      }
    }
  }
  const items = Object.keys(asset_listings).map(
    (key) => [key, asset_listings[key]],
  );
  items.sort(
    (first, second) => first[1] - second[1],
  );
  let sliced_items
  if (count === 'all') {
    sliced_items = items
  } else {
    sliced_items = items.slice(0, count)
  }
  let keys = sliced_items.map(
    (e) => e[0],
  );

  keys = await create_token_ids_30(keys)
  await push_command(slug, asset_contract_address, keys, 600, which)
}
async function update_db_owners() {

}
async function dump_focus_by_name() {
  const which = process.argv[3] || ''
  await redis_handler.dump_by_name(`focus:commands${which}`)
}
async function add_focus(slug, which = '', traits_only) {
  console.log(`Adding to focus:commads${which}...${slug}`)
  let assets = []
  // traits_only = true
  if (process.argv[5] === 'true') {
    // eslint-disable-next-line no-param-reassign
    traits_only = true
  }
  if (traits_only) {
    const traits = await mongo_handler.read_traits(slug)
    const traits_dict = traits.traits
    for (const trait in traits_dict) {
      for (const t in traits_dict[trait]) {
        const query = { slug, traits: { $elemMatch: { value: { $regex: t, $options: 'i' }, trait_type: { $regex: trait, $options: 'i' } } } }
        const temp_assets = await mongo_handler.find(query, { $caseSensitive: false })
        for (const a of temp_assets) {
          assets.push(a)
        }
      }
    }
  } else {
    assets = await mongo_handler.find({ slug }, {})
  }
  // const partition = Math.floor(assets.length / 4)
  // for (const a of assets) {
  //   if (a.token_id === '18529') {
  //     console.log('Found you!')
  //   }
  // }
  // console.log(partition)
  // if (process.argv[4] === 'beanz1') {
  //   assets = assets.slice(0, partition)
  // } else if (process.argv[4] === 'beanz2') {
  //   assets = assets.slice(partition, partition * 2)
  // } else if (process.argv[4] === 'beanz3') {
  //   assets = assets.slice(partition * 2, partition * 3)
  // } else if (process.argv[4] === 'beanz4') {
  //   assets = assets.slice(partition * 3, partition * 4)
  // }
  const token_ids = await create_token_ids_30(assets)
  const asset_contract_address = assets[0].token_address
  await push_command(slug, asset_contract_address, token_ids, 600, which)
}
async function create_token_ids_30(assets) {
  let asset_count = 0
  let temp_30_array = []
  const token_ids = []
  const staking_wallets = await mongo_handler.readStakingWallets()
  const slugs_staking_wallets = staking_wallets.map(({ address }) => address.toLowerCase())
  for (const asset of assets) {
    asset_count += 1
    if (!slugs_staking_wallets.includes(asset.owner) || asset.slug === 'ragnarok-meta') {
      // eslint-disable-next-line no-continue
      temp_30_array.push(asset.token_id || asset)
      if (temp_30_array.length === 30) {
        token_ids.push(temp_30_array)
        temp_30_array = []
      }
      if (asset_count === assets.length) {
        token_ids.push(temp_30_array)
      }
    }
  }
  return token_ids
}
async function find_flash() {
  const flash_wallets = await mongo_handler.get_flash_wallets()

  for (const wallet of flash_wallets) {
    const balance = await etherscan_handler.get_weth_balance(wallet.address)
    if (balance > 2.5) {
      console.log(`${wallet.username} ${balance.toFixed(2)}`)
    }
  }
}
async function push_command(slug, asset_contract_address, token_ids, duration, which = '') {
  let hash_counter = 0
  let counter = 0
  let which_focus
  if (process.argv[4]) {
    const index = 4
    which_focus = process.argv[index]
    if (which_focus === 'high') {
      which_focus = ''
    }
  } else {
    which_focus = which
  }
  for (const token_array of token_ids) {
    // console.log(`${hash_counter * 30}/${token_ids.length * 30}`)
    const command1 = {
      hash: `${slug}:${hash_counter}`,
      slug,
      collection_address: asset_contract_address,
      token_ids: token_array,
      // eslint-disable-next-line radix
      time_suggestion: parseInt(duration) * 60_000,
    }
    hash_counter += 1
    counter += token_array.length
    await redis_handler.redis_push_command(command1, which_focus)
  }
  console.log(`${counter} assets added to ${which_focus}.`)
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
async function add_int_traits_to_db() {
  const ranges = ['0-999', '1200-1299', '1300-1349', '1350-1380', '1381-1400']
  await mongo_handler.update_all_int_asset_traits(process.argv[3], process.argv[4], ranges)
}
async function add_int_traits_match_to_db() {
  const ranges1 = ['16-16', '17-17', '18-18']
  const ranges2 = ['5-5', '6-6', '7-10']
  await mongo_handler.update_all_int_asset_traits_matching(process.argv[3], process.argv[4], process.argv[5], ranges1, ranges2)
}
async function add_traits_match_to_db() {
  // size
  const ranges1 = ['biogenic swamp']
  // area
  const ranges2 = ['yes']
  await mongo_handler.update_all_match_asset_traits(process.argv[3], process.argv[4], process.argv[5], ranges1, ranges2)
}
main()

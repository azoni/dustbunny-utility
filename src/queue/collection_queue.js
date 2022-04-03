// add assets without reasonable bids into queue
const redis_handler = require('../handlers/redis_handler.js')
const opensea_handler = require('../handlers/opensea_handler.js')
const mongo = require('../AssetsMongoHandler.js')
const mongo_handler = require('../handlers/mongo_handler.js')
const utils = require('../utility/utils.js')

async function get_collection_bids(slug, exp, run_traits, timestamp, runtime) {
  const start_time = Math.floor(+new Date())
  await mongo_handler.connect()
  const blacklist_wallets = ['0xb56851362dE0f360E91e5F52eC64d0A1D52E98E6', '0x4d64bDb86C7B50D8B2935ab399511bA9433A3628', '0x18a73AaEe970AF9A797D944A7B982502E1e71556', '0x1AEc9C6912D7Da7a35803f362db5ad38207D4b4A', '0x35C25Ff925A61399a3B69e8C95C9487A1d82E7DF']
  const staking_wallets = await mongo.readStakingWallets()
  const slugs_staking_wallets = staking_wallets
    .map(({ address }) => address.toLowerCase());
  for (const w in blacklist_wallets) {
    blacklist_wallets[w] = blacklist_wallets[w].toLowerCase()
  }
  console.log(`Adding to queue...${slug}`)

  let bids_added = 0
  let order_count = 0
  let loop_counter = 0
  let query = { slug }
  let assets;
  if (run_traits === 'only') {
    const traits = await mongo.read_traits(slug)
    assets = []
    console.log(traits.traits)
    const traits_dict = traits.traits
    for (const trait in traits_dict) {
      query = { slug, traits: { $elemMatch: { value: { $regex: Object.keys(traits_dict[trait])[0], $options: 'i' }, trait_type: { $regex: trait, $options: 'i' } } } }
      const temp_assets = await mongo.find(query, { $caseSensitive: false })
      console.log(`${trait} ${traits_dict[trait]}`)
      for (const a of temp_assets) {
        assets.push(a)
      }
    }
  } else {
    assets = await mongo.find(query, {})
  }

  // token_ids = assets.map(({ token_id }) => token_id);
  const token_ids = []
  const asset_contract_address = assets[0].token_address
  let temp_30_array = []
  let asset_count = 0
  const trait_dict = {}
  for (const asset of assets) {
    asset_count += 1
    if (slugs_staking_wallets.includes(asset.owner)) {
      // eslint-disable-next-line no-continue
      continue
    }
    trait_dict[asset.token_id] = asset.traits
    temp_30_array.push(asset.token_id)
    if (temp_30_array.length === 30) {
      token_ids.push(temp_30_array)
      temp_30_array = []
    }
    if (asset_count === assets.length) {
      token_ids.push(temp_30_array)
    }
  }
  for (const token_array of token_ids) {
    // await utils.sleep(250)
    console.log(`${loop_counter}/${assets.length} for ${assets[0].slug}`)
    loop_counter += token_array.length
    const has_bids = {}
    let top_bids = 0
    let no_bids = 0
    // await utils.sleep(250)
    const asset_map = {}
    const orders = await opensea_handler
      .get_orders_window(asset_contract_address, timestamp, token_array)
    try {
      for (const o of orders) {
        has_bids[o.asset.tokenId] = true
        const asset = {}
        asset.token_id = o.asset.tokenId
        asset.traits = trait_dict[asset.token_id]
        asset.token_address = o.asset.tokenAddress
        asset.slug = o.asset.collection.slug
        asset.fee = o.asset.collection.devSellerFeeBasisPoints / 10000
        asset.event_type = 'collection'
        asset.expiration = 0.25
        asset.owner_address = o.makerAccount.address.toLowerCase()
        asset.owner = o.asset.owner.address.toLowerCase()
        // mongo_handler.update_owner_asset(asset.slug, asset.token_id, asset.owner)
        if (exp !== '') {
          asset.expiration = exp / 60
        }
        if (exp < 15) {
          asset.expiration = 0.25
        }
        order_count += 1
        asset.bid_amount = o.basePrice / 1000000000000000000
        if (!asset_map[asset.token_id]) {
          asset_map[o.asset.tokenId] = asset
        } else if (asset.bid_amount > asset_map[asset.token_id].bid_amount) {
          asset_map[asset.token_id] = asset
        }
      }
      if(timestamp === false) {
        for (const id of token_array) {
          if (!has_bids[id]) {
            no_bids += 1
            const asset = {}
            asset.token_id = id
            asset.token_address = asset_contract_address
            asset.slug = slug
            asset.event_type = 'no bids'
            asset.bid_amount = 0.01
            asset.expiration = 0.25
            if (exp !== '') {
              asset.expiration = exp / 60
            }
            if (exp < 15) {
              asset.expiration = 0.25
            }
            asset_map[asset.token_id] = asset
          }
        }
      }
      
      console.log(`assets with no bids: ${no_bids}`)
      for (const a in asset_map) {
        if (!blacklist_wallets.includes(asset_map[a].owner_address)
        && !slugs_staking_wallets.includes(a.owner)) {
          bids_added += 1
          asset_map[a].bidding_adress = '0xb56851362dE0f360E91e5F52eC64d0A1D52E98E6'
          await redis_handler.redis_push('collection', asset_map[a], run_traits);
        } else {
          top_bids += 1
        }
      }
      console.log(`added to queue: ${bids_added}`)
    } catch (ex) {
      console.log(ex)
      console.log(ex.message)
      console.log('error ')
    }
  }
  const queue_length = await redis_handler.get_queue_length('collection')
  console.log(`orders found: ${order_count}`)
  console.log(`bids added: ${bids_added}`)
  console.log(`Queue collection: ${queue_length}`)
  const end_time = Math.floor(+new Date())
  console.log(`run time: ${((end_time - start_time) / 60000).toFixed(2)} minutes`)
  // console.log(`timestamp ${((token_ids.length * 3000) / 60000).toFixed(2)}`)
  runtime += end_time - start_time
  // eslint-disable-next-line no-param-reassign
  exp = (end_time - start_time) / 60000
  timestamp = end_time - start_time
  console.log((runtime/60000).toFixed(2))
  if(runtime > 15*60000){
    runtime = 0
    timestamp = false
  }
  get_collection_bids(slug, exp, run_traits, timestamp, runtime)
}
async function start() {
  // const readline = require('readline-sync')
  // let slug = readline.question('slug: ')
  // let exp = readline.question('exp: ')
  // get_collection_bids(slug, exp)
  get_collection_bids(process.argv[3], process.argv[4], process.argv[5], false, 0)
}
// start()
module.exports = { start, get_collection_bids };

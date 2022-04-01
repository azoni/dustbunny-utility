/* eslint-disable no-param-reassign */
const url = require('url');
const http = require('http')
const manual = require('./queue/manual_queue.js')
const staking = require('./queue/staking_queue.js')
const rare = require('./queue/rare_queue.js')
const listed = require('./queue/listed_queue.js')
const flash = require('./queue/flash_queue.js')
const transfer = require('./queue/transfer_queue.js')
const smart = require('./queue/smart_queue.js')
const focus = require('./queue/focus_queue.js');
const bayc = require('./queue/bayc_queue.js');
const trait = require('./queue/trait_queue.js');
const collection = require('./queue/collection_queue.js');
const etherscan_handler = require('./handlers/etherscan_handler.js')
const myIp = require('./utility/what-is-my-ip.js');
const redis_handler = require('./handlers/redis_handler.js')
const mongo = require('./AssetsMongoHandler.js')
const mongo_handler = require('./handlers/mongo_handler.js')
const utils = require('./utility/utils.js')
const opensea_handler = require('./handlers/opensea_handler.js')
const flashbot_listed = require('./queue/flashbot_list.js');

// eslint-disable-next-line func-names
const requestListener = function (req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Request-Method', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  const urlParts = url.parse(req.url, true);
  res.writeHead(200)
  // console.log(req.url)
  if (req.url === '/redis_queue_pop') {
    redis_handler.redis_queue_pop().then((val) => {
      const v1 = val || [];
      res.write('[');
      let first = true;
      for (const el of v1) {
        if (!first) {
          res.write(',');
        } else {
          first = false;
        }
        res.write(el);
      }
      res.end(']');
    });
  } else if (urlParts.pathname === '/collectionstats' && req.method === 'GET') {
    const collectionname = urlParts.query?.name;
    if (collectionname) {
      redis_handler.client.GET(`${collectionname}:stats`)
        .then((x) => res.end(x))
        .catch((x) => {
          console.error(x);
          res.end();
        });
    } else {
      res.end('null');
    }
  } else if (req.url === '/floor' && req.method === 'POST') {
    let bod = [];
    req.on('error', (err) => {
      console.error(err);
    })
      .on('data', (chunk) => {
        bod.push(chunk);
      })
      .on('end', () => {
        bod = Buffer.concat(bod).toString();
        if (bod) {
          try {
            const r = JSON.parse(bod);
            if (r.collection && typeof r.collection === 'string' && r.floor >= 0) {
              const key = `${r.collection}:floor`;
              redis_handler.client.SETEX(key, 3600, r.floor).catch((x) => console.log(x));
              if (r.stats) {
                const statKey = `${r.collection}:stats`
                redis_handler.client
                  .SETEX(statKey, 3600, JSON.stringify(r.stats)).catch((x) => console.log(x));
              }
            }
          } catch (ex) {
            console.log(ex);
          }
        }
        res.end();
      })
  } else if (urlParts.pathname === '/floor' && req.method === 'GET') {
    const collectionname = urlParts.query?.name;
    if (collectionname) {
      redis_handler.client.GET(`${collectionname}:floor`).then((x) => res.end(x));
    } else {
      res.end('null');
    }
  } else if (urlParts.pathname === '/length' && req.method === 'GET') {
    // eslint-disable-next-line no-unused-vars
    redis_handler.get_queue_length('flash').then((x) => res.end(`${x}`)).catch((_) => res.end('-1'));
  } else {
    res.end('{error:"bye you"}');
  }
}

function connect() {
  const server = http.createServer(requestListener)
  server.listen(3000, myIp, () => {
    console.log('Server is running')
  })
}
async function add_focus() {
  // basePrice/1000000000000000000
  // let assets = await opensea_handler.get_assets_with_cursor('boredapeyachtclub')
  const token_array = ['3132']// , '2874', '3485', '4865', '4019', '7165', '5536', '7184']
  for (const token of token_array) {
    const asset = await mongo.readAssetBySlug('azuki', token)
    const trimmed_asset = {}
    trimmed_asset.token_id = asset.token_id
    trimmed_asset.traits = asset.traits
    trimmed_asset.token_address = asset.token_address
    trimmed_asset.slug = asset.slug
    trimmed_asset.fee = asset.dev_seller_fee_basis_points / 10000
    trimmed_asset.event_type = 'hyper'
    trimmed_asset.expiration = 0.25
    trimmed_asset.bid_range = false
    trimmed_asset.tier = 'high';
    const command1 = {
      hash: `${trimmed_asset.slug}:${trimmed_asset.token_id}`,
      slug: trimmed_asset.slug,
      collection_address: trimmed_asset.token_address,
      token_ids: [trimmed_asset.token_id],
      time_suggestion: 600 * 60_000,
    }
    await redis_handler.redis_push_command(command1)
    console.log(`${token} added.`)
  }
}

async function trait_floor() {
  console.log(process.argv)
  const query = { slug: process.argv[3], traits: { $elemMatch: { value: { $regex: String(process.argv[5]), $options: 'i' }, trait_type: { $regex: String(process.argv[4]), $options: 'i' } } } }
  const assets = await mongo.find(query, {})
  console.log(assets.length)
  const token_ids = []
  const asset_contract_address = assets[0].token_address
  let temp_30_array = []
  let asset_count = 0
  for (const asset of assets) {
    asset_count += 1
    temp_30_array.push(asset.token_id)
    if (temp_30_array.length === 30) {
      token_ids.push(temp_30_array)
      temp_30_array = []
    }
    if (asset_count === assets.length) {
      token_ids.push(temp_30_array)
    }
  }
  const ordered_listings = []
  const asset_listings = {}
  for (const token_array of token_ids) {
    await utils.sleep(500)
    const orders = await opensea_handler
      .get_orders_window(asset_contract_address, false, token_array, 1)
    console.log(`order length: ${orders.length}`)
    for (const o of orders) {
      const listing_price = o.currentPrice / 1000000000000000000
      console.log(`${o.asset.tokenId} ${listing_price}`)
      if (!asset_listings[o.asset.tokenId]) {
        ordered_listings.push(listing_price)
        asset_listings[o.asset.tokenId] = [listing_price]
      } else {
        asset_listings[o.asset.tokenId].push(listing_price)
      }
    }
  }
  console.log(ordered_listings.length)
  console.log(`Trait floor: ${ordered_listings.sort()}`)
  for (const l in asset_listings) {
    console.log(`${l} ${asset_listings[l]}`)
  }
}

if (!myIp) {
  throw new Error(`cant get ip: "${myIp}"`);
}

async function run_interactive() {
  // eslint-disable-next-line global-require
  const readline = require('readline-sync')
  const command = process.argv[2]
  if (command === 'comp') {
    const address = readline.question('address: ')
    const time_window = readline.question('window: ')
    const exp = readline.question('expire: ')
    manual.get_competitor(address, time_window * 1000, exp)
    // add option for flat bid, and expiration
  } else if (command === 'man') {
    manual.start()
  } else if (command === 'add-focus') {
    add_focus()
  } else if (command === 'flash') {
    flash.start()
  } else if (command === 'staking') {
    staking.start()
  } else if (command === 'listed') {
    listed.start()
  } else if (command === 'greedy') {
    flashbot_listed.start()
  } else if (command === 'rare') {
    rare.start()
  } else if (command === 'bayc') {
    bayc.start()
  } else if (command === 'trait') {
    trait.start()
  } else if (command === 'coll') {
    collection.start()
  } else if (command === 'transfer') {
    transfer.start()
  } else if (command === 'smart') {
    smart.start()
  } else if (command === 'trait-floor') {
    trait_floor()
  } else if (command === 'dump') {
    redis_handler.dump_queue(process.argv[3])
  } else if (command === 'len') {
    redis_handler.print_queue_length(process.argv[3])
    if (process.argv[3] === 'all') {
      let total_bids = 0
      let loops = 1
      // eslint-disable-next-line no-constant-condition
      while (true) {
        await redis_handler.print_queue_length('high')
        await redis_handler.print_queue_length('rare')
        await redis_handler.print_queue_length('listed')
        await redis_handler.print_queue_length('transfer')
        await redis_handler.print_queue_length('staking')
        await redis_handler.print_queue_length('collection')
        await redis_handler.print_queue_length('flash')
        await redis_handler.print_queue_length('manual')
        const flash_length = await redis_handler.get_queue_length('flash')
        if (flash_length > 10000) {
          redis_handler.dump_queue('flash')
        }
        console.log()
        const orders = await opensea_handler.get_orders_window('0x18a73AaEe970AF9A797D944A7B982502E1e71556', 3000)
        await utils.sleep(10000)
        const orders2 = await opensea_handler.get_orders_window('0x35C25Ff925A61399a3B69e8C95C9487A1d82E7DF', 3000)
        console.log(`${(orders.length + orders2.length) * 20} bids per minute`)
        total_bids += (orders.length + orders2.length) * 20
        console.log(`Average bpm: ${(total_bids / loops).toFixed()}`)
        if ((orders.length + orders2.length) < 1) {
          console.log('Queues are empty.')
        }
        if ((orders.length + orders2.length) * 20 < 1000 && (orders.length + orders2.length) > 0) {
          console.log('Bidding is currently slow.')
        }
        console.log('----------------------')
        console.log()
        await utils.sleep(10000)
        loops += 1
      }
    }
  } else if (command === 'focus') {
    focus.start();
  } else {
    console.log('Invalid command.')
  }
}
async function main() {
  const wallets = {
    wallet1: {
      username: 'DustBunny_19',
      address: '0x18a73AaEe970AF9A797D944A7B982502E1e71556',
    },
    // 'wallet2': {
    // username: 'DustBunny_20',
    // address: '0x4d64bDb86C7B50D8B2935ab399511bA9433A3628'
    // },
    // 'wallet3': {
    // username: 'DustBunny_21',
    // address: '0x1AEc9C6912D7Da7a35803f362db5ad38207D4b4A'
    // },
    wallet4: {
      username: 'DustBunny_22',
      address: '0x35C25Ff925A61399a3B69e8C95C9487A1d82E7DF',
    },
  }
  let total_weth = 0
  for (const account in wallets) {
    const balance = await etherscan_handler.get_weth_balance(wallets[account].address)
    wallets[account].balance = balance
    total_weth += balance
  }
  console.log(wallets)
  console.log(`total weth: ${total_weth.toFixed(2)}`)
  // let listed_assets = await opensea_handler.get_listed_asset('kaiju-kingz')
  // for(let listed of listed_assets){
  // console.log(listed)
  // }

  console.log(myIp)
  if (myIp === '10.0.0.59') {
    connect()
  }
  function shuffleArray(array) {
    // eslint-disable-next-line no-plusplus
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
  }
  await redis_handler.start_connection()
  await mongo.connect()
  await mongo_handler.connect()
  // const opensea_keys = await mongo_handler.get_opensea_keys()
  // const opensea__api_keys = opensea_keys.map(({ api_key }) => api_key)
  // console.log('Starting bids...')
  // shuffleArray(opensea__api_keys)
  // await opensea_handler.test_bid(opensea__api_keys)
  // let comp_wallets = await mongo_handler.get_comp_wallets()
  // let our_wallets = await mongo_handler.get_our_wallets()
  // let comp_addresses = []
  // let our_addresses = []
  // comp_addresses = comp_wallets.map(({address}) => address.toLowerCase())
  // our_addresses = our_wallets.map(({address}) => address.toLowerCase())
  // let addresses = [...comp_addresses, ...our_addresses]
  // console.log(addresses)
  run_interactive()
}
main()

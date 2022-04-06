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
// eslint-disable-next-line no-unused-vars
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
async function add_focus(slug, token_ids) {
  // basePrice/1000000000000000000
  // let assets = await opensea_handler.get_assets_with_cursor('boredapeyachtclub')
  // const token_array = ['3132']// , '2874', '3485', '4865', '4019', '7165', '5536', '7184']
  for (const token of token_ids) {
    const asset = await mongo.readAssetBySlug(slug, token)
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
    let which = ''
    if (process.argv[4]) {
      // eslint-disable-next-line prefer-destructuring
      which = process.argv[4]
      console.log(which)
    }
    await redis_handler.redis_push_command(command1, which)
    console.log(`${token} added.`)
  }
}

async function trait_floor() {
  let query = { slug: process.argv[3], traits: { $elemMatch: { value: { $regex: String(process.argv[5]), $options: 'i' }, trait_type: { $regex: String(process.argv[4]), $options: 'i' } } } }
  query = { slug: process.argv[3] }
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
  const asset_listings = {}
  let listing_count = 0
  for (const token_array of token_ids) {
    await utils.sleep(500)
    const orders = await opensea_handler
      .get_orders_window(asset_contract_address, false, token_array, 1)
    // console.log(`order length: ${orders.length}`)
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
      // ordered_listings.push(listing_price)
    }
  }

  const items = Object.keys(asset_listings).map(
    (key) => [key, asset_listings[key]],
  );
  items.sort(
    (first, second) => first[1] - second[1],
  );
  const sliced_items = items// .slice(0, 30)
  const keys = sliced_items.map(
    (e) => e[0],
  );

  console.log(keys);
  add_focus(process.argv[3], keys)
  // console.log(ordered_listings.length)
  // console.log(`floor: ${trait_floor_prices}`)
  // for (const l in asset_listings) {
  //   console.log(`${l} ${asset_listings[l]}`)
  // }
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
    if (process.argv[3] === 'all') {
      redis_handler.dump_queue('high')
      redis_handler.dump_queue('listed')
      redis_handler.dump_queue('transfer')
      redis_handler.dump_queue('collection')
      redis_handler.dump_queue('flash')
      redis_handler.dump_queue('manual')
    } else {
      redis_handler.dump_queue(process.argv[3])
    }
  } else if (command === 'len') {
    if (process.argv[3] === 'all') {
      let total_bids = 0
      let loops = 1
      // eslint-disable-next-line no-constant-condition
      const queue_names = ['high', 'listed', 'transfer', 'collection', 'flash', 'manual']
      let account1
      let account2
      let temp_account1
      let temp_account2
      account1 = await etherscan_handler.get_weth_balance('0xB1CbED4ab864e9215206cc88C5F758fda4E01E25')
      account2 = await etherscan_handler.get_weth_balance('0x763be576919a0d32b9e7ebDaF5a858195E04A6Cb')
      temp_account1 = account1
      temp_account2 = account2
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
        const orders2 = await opensea_handler.get_orders_window('0x763be576919a0d32b9e7ebDaF5a858195E04A6Cb', 5000)
        console.log(`${(orders.length + orders2.length) * 12} bids per minute`)
        total_bids += (orders.length + orders2.length) * 12
        console.log(`Average bpm: ${(total_bids / loops).toFixed()}`)
        if ((orders.length + orders2.length) < 1) {
          console.log()
          console.log('Queues are empty.')
        }
        if ((orders.length + orders2.length) * 12 < 400 && (orders.length + orders2.length) > 0) {
          console.log('Bidding is currently slow.')
        } else if ((orders.length + orders2.length) === 0) {
          console.log()
          console.log('**NO BIDS BEING MADE**')
          console.log()
        }

        account1 = await etherscan_handler.get_weth_balance('0xB1CbED4ab864e9215206cc88C5F758fda4E01E25')
        account2 = await etherscan_handler.get_weth_balance('0x763be576919a0d32b9e7ebDaF5a858195E04A6Cb')
        if (temp_account1 !== account1) {
          console.log('================Dustbunny buy================')
        } else {
          temp_account1 = account1
        }
        if (temp_account2 !== account2) {
          console.log('================Dustbunny_18 buy================')
        } else {
          temp_account2 = account2
        }
        console.log(`DustBunny: ${account1.toFixed(2)}`)
        console.log(`DustBunny_18: ${account2.toFixed(2)}`)
        console.log(`Total weth: ${(account1 + account2).toFixed(2)}`)
        console.log('----------------------')
        await utils.sleep(5000)
        loops += 1
      }
    }
    redis_handler.print_queue_length(process.argv[3])
  } else if (command === 'focus') {
    focus.start();
  } else {
    console.log('Invalid command.')
  }
}
async function main() {
  // const wallets = {
  //   wallet1: {
  //     username: 'DustBunny_19',
  //     address: '0x18a73AaEe970AF9A797D944A7B982502E1e71556',
  //   },
  //   // 'wallet2': {
  //   // username: 'DustBunny_20',
  //   // address: '0x4d64bDb86C7B50D8B2935ab399511bA9433A3628'
  //   // },
  //   // 'wallet3': {
  //   // username: 'DustBunny_21',
  //   // address: '0x1AEc9C6912D7Da7a35803f362db5ad38207D4b4A'
  //   // },
  //   wallet4: {
  //     username: 'DustBunny_22',
  //     address: '0x35C25Ff925A61399a3B69e8C95C9487A1d82E7DF',
  //   },
  // }
  // let total_weth = 0
  // for (const account in wallets) {
  //   const balance = await etherscan_handler.get_weth_balance(wallets[account].address)
  //   wallets[account].balance = balance
  //   total_weth += balance
  // }
  // console.log(wallets)
  // console.log(`total weth: ${total_weth.toFixed(2)}`)
  // let listed_assets = await opensea_handler.get_listed_asset('kaiju-kingz')
  // for(let listed of listed_assets){
  // console.log(listed)
  // }

  console.log(myIp)
  if (myIp === '10.0.0.59') {
    connect()
  }
  // eslint-disable-next-line no-unused-vars
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
  // const chris_keys = [
  //   '0865f887ab0e407bacc4f50a5ccfbe43',
  //   '86360c61515a4100a52b884db4297a0a',
  //   '53670eb145e744c38e33aa67d6a9c5f2',
  //   'a75e5184a4d644a6bbaf1d533586b5a2',
  //   '59c4998451ed4203b728542b320820aa',
  //   '3a756e159f6543a29bac0b5dfe05cdc5',
  //   '54fbaf6e1510440e8c912a78b407aabc',
  //   '07bcfe2a61e2405ca720cbed9dff4a6a',
  //   '70cc4d5441364f6e94178ed2fde2f63e',
  //   '08a43e33a64f4be0bf60991b2fd734f6',
  //   'eb15dde4d79c487bb6d90a955f586ac6',
  //   '628192c274bf46ffa497f724126b2d95',
  //   '6447cc33bb364ee69dd822948711b9eb',
  //   '0dfad8a7f7254f74a86eb2c7270568f1',
  //   '70eb0d72e9a8421d8969c1bc9e865469',
  // ]
  // const usable_keys = [
  //   '04903a94a949443f96061e0046b034c7',
  //   '3e994eb084474893abe7842014dbd66c',
  //   '183e20b9d8f24da3a3bfdc9bcc384ec3',
  //   '4b7d65a561134155970501edaa04b5d2',
  //   'ade086f2f73f4bb7aa63abd1ab0afcb1',
  //   'bfb44f9711eb4c49bb05e6f8d56d0ea5',
  //   '5c93bcf2e40643438ee849894831bb0e',
  //   'a1a9c9b3d63a4855bfdfd38634d42b13',
  //   '8c2f58482e71447ab9f2fdfc26ed36d4',
  //   '69f7f946a4b24c1386de2a4f0cf0f870',
  //   'fd933408b9604c2f89af28c1a2022210',
  //   '6061f7f616fe498c9708d102d0b9c407',
  //   '9f341b7c6420433c8f6c5973ddc50aad',
  //   '96d8c5bc3d38408e9e05f261aee738b2',
  //   'becbd5981e0c482083b3bac4267ad651',
  // ]
  // await opensea_handler.test_bid(opensea__api_keys)
  // for (const api_key of opensea__api_keys) {
  //   console.log(api_key)
  //   await mongo_handler.update_opensea_key(api_key)
  // }

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

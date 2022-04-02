// const secret = require('./secret_node.js')
const opensea = require('opensea-js')

const { Network } = opensea;
// eslint-disable-next-line import/no-extraneous-dependencies
const RPCSubprovider = require('web3-provider-engine/subproviders/rpc');
// eslint-disable-next-line import/no-extraneous-dependencies
const Web3ProviderEngine = require('web3-provider-engine');
// eslint-disable-next-line no-unused-vars
const { WyvernSchemaName } = require('opensea-js/lib/types')
const { MnemonicWalletSubprovider } = require('@0x/subproviders');
const values = require('../values.js')

const { OpenSeaPort } = opensea;

const providerEngine = new Web3ProviderEngine();
const MNEMONIC = 'inherit scrub other float window beef build flash monkey play add satisfy'
const mnemonicWalletSubprovider = new MnemonicWalletSubprovider({
  mnemonic: MNEMONIC,
});
const infuraRpcSubprovider = new RPCSubprovider({
  rpcUrl: 'https://mainnet.infura.io/v3/deb8c4096c784171b97a21f7a5b7ba98',
});
providerEngine.addProvider(mnemonicWalletSubprovider);
providerEngine.addProvider(infuraRpcSubprovider);
const seaport = new OpenSeaPort(
  providerEngine,
  {
    networkName: Network.Main,
    apiKey: values.API_KEY, // '9e72715b3e504813ac3ebc0512d473bf'
  },
  (arg) => console.log(arg),
);

function start() {
  providerEngine.start()
}
// eslint-disable-next-line no-unused-vars
function create_seaport(key) {
  providerEngine.stop();
  const seaport_temp = new OpenSeaPort(
    providerEngine,
    {
      networkName: Network.Main,
      apiKey: key,
    },
    (arg) => console.log(arg),
  );
  providerEngine.start()
  return seaport_temp
}
async function test_bid() {
  let success = 0
  let fail = 0
  // for (const key of keys) {
  // const seaport_temp = create_seaport(key)
  const asset = {
    tokenId: '8573', // '1',
    tokenAddress: '0x24998f0a028d197413ef57c7810f7a5ef8b9fa55', // '0x2079812353e2c9409a788fbf5f383fa62ad85be8',
    // schemaName: WyvernSchemaName.ERC1155,
  }
  try {
    await seaport.createBuyOrder({
      asset,
      startAmount: 0.0001,
      accountAddress: '0xB1CbED4ab864e9215206cc88C5F758fda4E01E25',
      expirationTime: Math.round(Date.now() / 1000 + 60 * 60 * 0.25),
    })
    // console.log(`Success' ${key}`)
    success += 1
  } catch (ex) {
    console.log(ex.message)
    if (ex.message.includes('API Error 403')) {
      // console.log(`Access was denied. ${key}`)
    } else if (ex.message.includes('API Error 401')) {
      // console.log(`Expired API key. ${key}`)
    } else {
      console.log(ex.message)
    }
    fail += 1
  }
  // }
  console.log(`success ${success}`)
  console.log(`fail ${fail}`)
  return 'fail'
}

async function get_assets_with_cursor(slug) {
  const limit = 50;
  let cursor = '';
  const result = [];
  do {
    const resourceUrl = createGetAssetURL({ slug, limit, cursor });
    // console.log(resourceUrl);
    const response = await fetchAssetPage(resourceUrl);
    cursor = response.cursor
    const assets = response.body?.assets || [];
    for (const asset of assets) {
      const ass = {
        name: asset.name,
        token_id: asset.token_id,
        token_address: asset.asset_contract?.address,
        image_url: asset.image_url,
        slug,
        // eslint-disable-next-line radix
        dev_seller_fee_basis_points: parseInt(asset.collection?.dev_seller_fee_basis_points),
        traits: asset.traits || [],
        owner_address: asset?.owner?.address || '',
      };
      if (asset.sell_orders !== null) {
        ass.listed_price = asset.sell_orders[0].current_price / 1000000000000000000
      }
      result.push(ass);
    }
    await sleep(500);
  } while (cursor);

  return result;
}

async function handleError(url, retry) {
  switch (retry) {
    case 3:
      return sleep(2000).then(() => fetchAssetPage(url, retry - 1));
    case 2:
      return sleep(3000).then(() => fetchAssetPage(url, retry - 1));
    case 1:
      return sleep(4000).then(() => fetchAssetPage(url, retry - 1));
    default:
      return sleep(6000).then(() => fetchAssetPage(url, retry - 1));
  }
}
let asset_cursor_count = 0
async function fetchAssetPage(url, retry = 3) {
  const options = { method: 'GET', headers: { Accept: 'application/json', 'X-API-KEY': values.API_KEY } };
  return fetch(url, options)
    .then((response) => response.json())
    .then((response) => {
      if (response.assets === undefined && retry > 0) {
        return handleError(url, retry);
      }
      asset_cursor_count += (response.assets?.length || 0)
      console.log(`cursor: ${response.next}\nlen: ${response.assets?.length}\n`);
      console.log(asset_cursor_count)
      return { cursor: response.next, len: response.assets?.length, body: response };
    })
    .catch((err) => {
      console.error(err);
      if (retry > 0) {
        return handleError(url, retry);
      }
      return { cursor: undefined, len: 0 }
    });
}

function createGetAssetURL({ slug, limit = 50, cursor }) {
  const resourceUrl = `${'https://api.opensea.io/api/v1/assets?'
  + `collection=${slug}`
  + '&order_by=pk'}${
    cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''
  // `&order_direction=${direction}` +
  }&limit=${limit}`
  + '&include_orders=true'
  return resourceUrl
}

// return all assets from collcetion
async function get_assets(slug) {
  let offset = 0
  const limit = 50
  let assets_length = 0
  const assets_list = []

  do {
    try {
      await sleep(250)
      const assets = await seaport.api.getAssets({
        collection: slug,
        offset,
        limit,
      })
      assets.assets.forEach((asset) => {
        assets_list.push(asset)
      })
      assets_length = assets.assets.length
      offset += 50
      if (offset % 1000 === 0) {
        console.log(offset)
      }
    } catch (e) {
      console.log(e.message)
    }

    if (offset > 10000) {
      assets_length = 1
    }
  } while (assets_length === 50)

  return assets_list
}
// Return listed of assets listed for sale
async function get_listed_asset(slug) {
  const listed_assets = []
  const assets = await get_assets_with_cursor(slug)
  for (const asset of assets) {
    if (asset.listed_price) {
      listed_assets.push(asset)
    }
  }
  return listed_assets
}

// Get assets by owner, or filter out all assets owned by an owner. Ex. Staking wallet.
// eslint-disable-next-line no-unused-vars
async function get_asset_by_owner(slug, address, isOwned) {
  const listed_assets = []
  const assets = await get_assets(slug)
  for (const asset of assets) {
    if (asset.owner.address === address && isOwned) {
      listed_assets.push(asset)
    } else if (asset.owner.address !== address && !isOwned) {
      listed_assets.push(asset)
    }
  }
  return listed_assets
}
// return collection info
// floor, fee, volume, token addres, etc
async function get_collection(slug) {
  try {
    const collect = await seaport.api.get(`/api/v1/collection/${slug}`)
    return collect
  } catch (ex) {
    console.log("couldn't get collection info")
  }
  return 0
}

async function get_listed_lowered(time_window) {
  let offset = 0
  const search_time = get_ISOString(time_window)
  const search_time2 = get_ISOString_now()
  const orders_array = []
  let order = 0
  let order_length = 0;
  do {
    await sleep(250)
    try {
      order = await seaport.api.getOrders({
        side: 1,
        order_by: 'created_date',
        listed_after: search_time,
        listed_before: search_time2,
        limit: 50,
        offset,
      });
      order_length = order.orders.length
      for (const o of order.orders) {
        orders_array.push(o)
      }
    } catch (ex) {
      order_length = 0
      console.log(ex.message)
      console.log('----error with buy orders')
    }
    offset += 50
  } while (order_length === 50)
  console.log(`${orders_array.length} listing`)
  return orders_array
}
// order['orders'][o].taker !== '0x0000000000000000000000000000000000000000'
const blacklist_wallets = ['0x4d64bDb86C7B50D8B2935ab399511bA9433A3628', '0x18a73AaEe970AF9A797D944A7B982502E1e71556', '0x1AEc9C6912D7Da7a35803f362db5ad38207D4b4A', '0x35C25Ff925A61399a3B69e8C95C9487A1d82E7DF']
for (const w in blacklist_wallets) {
  blacklist_wallets[w] = blacklist_wallets[w].toLowerCase()
}
async function get_orders_window(address, time_window, token_ids, side) {
  let offset = 0
  const search_time = get_ISOString(time_window)
  const search_time2 = get_ISOString_now()
  const orders_array = []
  let order = 0
  let username = 'Null'
  let order_length = 0
  let order_api_data = {
    side: 0,
    order_by: 'created_date',
    listed_after: search_time,
    listed_before: search_time2,
    limit: 50,
    offset,
  }
  if (time_window === false) {
    order_api_data = {
      side: 0,
      order_by: 'eth_price',
      order_direction: 'desc',
      limit: 50,
      offset,
    }
  }
  if (token_ids) {
    order_api_data.asset_contract_address = address
    order_api_data.token_ids = token_ids
  } else if (address !== 'all') {
    order_api_data.maker = address
  }
  if (side) {
    order_api_data.side = 1
  }
  do {
    await sleep(250)
    try {
      order_api_data.offset = offset;
      order = await seaport.api.getOrders(order_api_data)
      try {
        username = order.orders[0].makerAccount.user.username
      } catch (ex) {
        username = 'Null'
      }
      order_length = order.orders.length
      for (const o of order.orders) {
        if (o.paymentTokenContract.symbol === 'WETH' || o.paymentTokenContract.symbol === 'ETH') {
          orders_array.push(o)
        }
      }
    } catch (ex) {
      order_length = 0
      console.log(ex.message)
      console.log('----error with buy orders')
    }
    offset += 50
    // console.log(orders_array.length)
  } while (order_length === 50)
  if (!side) {
    console.log(`${orders_array.length} bids made by ${username}`)
  }

  return orders_array
}

// buy nft with ETH - example code
// eslint-disable-next-line no-unused-vars
async function fulfil_order() {
  const asset = await seaport.api.getAsset({
    tokenAddress: '0x9508f760833b82cdfc030d66aa278c296e013f57',
    tokenId: 1381,
  })
  const sell_order = asset.sellOrders[0]

  try {
    const transactionHash = await seaport.fulfillOrder({
      order: sell_order,
      accountAddress: '0xcAe462347cd2d83f9A548AFAcb2CA6E0C6063BfF',
    })
    console.log(transactionHash)
  } catch (ex) {
    console.log('catch')
    console.log(ex)
  }
}

async function sleep(ms) {
  // eslint-disable-next-line no-promise-executor-return
  await new Promise((resolve) => setTimeout(resolve, ms))
}
function get_ISOString(seconds) {
  const search_time = Math.floor(+new Date()) - seconds
  return new Date(search_time).toISOString();
}
function get_ISOString_now() {
  const search_time = Math.floor(+new Date())
  return new Date(search_time).toISOString();
}

module.exports = {
  start,
  seaport,
  get_collection,
  get_assets,
  get_orders_window,
  get_assets_with_cursor,
  get_listed_lowered,
  get_listed_asset,
  test_bid,
};

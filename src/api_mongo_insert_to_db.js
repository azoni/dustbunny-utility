// eslint-disable-next-line import/no-extraneous-dependencies
const Web3ProviderEngine = require('web3-provider-engine');
const mongoose = require('mongoose');
const opensea = require('opensea-js')
const values = require('./values.js')

const { Network } = opensea;
const { OpenSeaPort } = opensea;

const providerEngine = new Web3ProviderEngine();

const { API_KEY } = values;
if (API_KEY === '') {
  throw new Error('You forgot to set the api key.')
}
const Asset = new mongoose.Schema({
  name: String,
  token_id: String,
  token_address: String,
  image_url: String,
  slug: String,
  dev_seller_fee_basis_points: Number,
  traits: [],
});

const Kitten = mongoose.model('nftasset', Asset);

main().catch((err) => console.log(err));

async function main() {
  if (process.argv[2] !== 'add') {
    return
  }
  try {
    await mongoose.connect('mongodb://10.0.0.80:27017/test');
    // const k =  await Kitten.findOne();
    // console.log(k.traits[0]);
    console.log(process.argv)

    if (process.argv.length !== 4) {
      return
    }

    const kk = await Kitten.findOne({ slug: process.argv[3] })
    if (kk) {
      console.log('already in the database');
      return;
    }
    await getAsset(process.argv[3]);
  } finally {
    mongoose.connection.close();
  }
}
// providerEngine.addProvider(mnemonicWalletSubprovider);
// providerEngine.addProvider(infuraRpcSubprovider);

const seaport = new OpenSeaPort(
  providerEngine,
  {
    networkName: Network.Main,
    apiKey: API_KEY,
  },
  (arg) => console.log(arg),
);

const options = { method: 'GET', headers: { Accept: 'application/json', 'X-API-KEY': 'fd933408b9604c2f89af28c1a2022210' } };

// fetch('https://api.opensea.io/api/v1/assets?collection=cryptoadz-by-gremplin&order_by=pk&order_direction=desc&limit=50&cursor=LXBrPTQ3NzkwMzg0&include_orders=false', options)
//  .then(response => response.json())
//  .then(response => console.log(response))
//  .catch(err => console.error(err));

async function getAsset(slug, direction = 'desc') {
  const limit = 50;
  let cursor = '';

  do {
    const resourceUrl = createGetAssetURL({
      slug, direction, limit, cursor,
    });
    console.log(resourceUrl);
    const response = await fetchAssetPage(resourceUrl);
    cursor = response.cursor
    const assets = response.body?.assets || [];
    for (const asset of assets) {
      const silence = new Kitten({
        name: asset.name,
        token_id: asset.token_id,
        token_address: asset.asset_contract?.address,
        image_url: asset.image_url,
        slug,
        // eslint-disable-next-line radix
        dev_seller_fee_basis_points: parseInt(asset.collection?.dev_seller_fee_basis_points),
        traits: asset.traits || [],
      });
      await silence.save();
      console.log(silence.name);
    }
    await sleep(1000);
  } while (cursor);
}
async function add_asset(slug, token_address, token_id) {
  await mongoose.connect('mongodb://10.0.0.80:27017/test');
  const asset = await seaport.api.getAsset({
    tokenAddress: token_address,
    tokenId: token_id,
  })
  const silence = new Kitten({
    name: asset.name,
    token_id,
    token_address,
    image_url: asset.image_url,
    slug,
    traits: asset.traits || [],
  });
  await silence.save();
  // console.log(silence.name);
  await sleep(1000);
  mongoose.connection.close();
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

async function fetchAssetPage(url, retry = 3) {
  return fetch(url, options)
    .then((response) => {
      console.log(response.status);
      return response.json();
    })
    .then((response) => {
      if (response.assets === undefined && retry > 0) {
        return handleError(url, retry);
      }
      console.log(`cursor: ${response.next}\nlen: ${response.assets?.length}\n`);
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

function createGetAssetURL({
  slug, limit = 50, cursor,
}) {
  const resourceUrl = `${'https://api.opensea.io/api/v1/assets?'
  + `collection=${slug}`
  + '&order_by=pk'}${
    cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''
  // `&order_direction=${direction}` +
  }&limit=${limit}`
  + '&include_orders=false'
  return resourceUrl
}

async function sleep(ms) {
  // eslint-disable-next-line no-promise-executor-return
  await new Promise((resolve) => setTimeout(resolve, ms))
}
module.exports = {
  getAsset,
  add_asset,
  Kitten,
}

const opensea = require("opensea-js")
const Network = opensea.Network;
const OpenSeaPort = opensea.OpenSeaPort;
const Web3ProviderEngine = require("web3-provider-engine");
const providerEngine = new Web3ProviderEngine();
const mongoose = require('mongoose');

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


main().catch(err => console.log(err));

async function main() {
  try {
    await mongoose.connect('mongodb://localhost:27017/test');
    //const k =  await Kitten.findOne();
    //console.log(k.traits[0]);
    console.log(process.argv)
    
    if (process.argv.length !== 3) {
      console.error('not enough args');
      throw new Error('not enough args');
    }
  
    const kk = await Kitten.findOne({ slug: process.argv[2]})
    if (kk) {
      console.log('already in the database');
      return;
    }
    await getAsset(process.argv[2]);
  } finally {
    mongoose.connection.close();
  }
}
// providerEngine.addProvider(mnemonicWalletSubprovider);
// providerEngine.addProvider(infuraRpcSubprovider);

var seaport = new OpenSeaPort(
  providerEngine,
  {
    networkName: Network.Main,
    apiKey: '578c069362bf4af7aa66b61e844867a9'
  },
  (arg) => console.log(arg)
);

const options = {method: 'GET', headers: {Accept: 'application/json', 'X-API-KEY': '578c069362bf4af7aa66b61e844867a9'}};

//fetch('https://api.opensea.io/api/v1/assets?collection=cryptoadz-by-gremplin&order_by=pk&order_direction=desc&limit=50&cursor=LXBrPTQ3NzkwMzg0&include_orders=false', options)
//  .then(response => response.json())
//  .then(response => console.log(response))
//  .catch(err => console.error(err));

async function getAsset(slug, direction = 'desc') {
  const limit = 50;
  let cursor = '';


  do {
    let resourceUrl = createGetAssetURL({ slug, direction, limit, cursor });
    console.log(resourceUrl);
    let response =  await fetchAssetPage(resourceUrl);
    cursor = response.cursor
    const assets = response.body?.assets || [];
    for (const asset of assets) {
      const silence = new Kitten({
        name: asset.name,
        token_id: asset.token_id,
        token_address: asset.asset_contract?.address,
        image_url: asset.image_url,
        slug: slug,
        dev_seller_fee_basis_points: parseInt(asset.collection?.dev_seller_fee_basis_points),
        traits: asset.traits || []
      });
      await silence.save();
      console.log(silence.name);
    }
    await sleep(1000);
  } while (cursor);
}

async function handleError(url, retry) {
  switch (retry) {
    case 3:
      return sleep(2000).then(_ => fetchAssetPage(url, retry - 1));
    case 2:
      return sleep(3000).then(_ => fetchAssetPage(url, retry - 1));
    case 1:
      return sleep(4000).then(_ => fetchAssetPage(url, retry - 1));
    default:
      return sleep(6000).then(_ => fetchAssetPage(url, retry - 1));
  }
}

async function fetchAssetPage(url, retry = 3) {
  return fetch(url, options)
  .then(response => {
    console.log(response.status);
    return response.json();
  })
  .then(response => {
    if (response.assets === undefined && retry > 0) {
      return handleError(url, retry);
    }
    console.log(`cursor: ${response.next}\nlen: ${response.assets?.length}\n`);
    return { cursor: response.next, len: response.assets?.length, body: response };
  })
  .catch(err => {
    console.error(err);
    if (retry > 0) {
      return handleError(url, retry);
    }
    return { cursor: undefined, len: 0 }
  });
}

function createGetAssetURL({ slug, direction = 'desc', limit = 50, cursor }) {
  let resourceUrl = 'https://api.opensea.io/api/v1/assets?' +
  `collection=${slug}` +
  `&order_by=pk` +
  (cursor ? `&cursor=${encodeURIComponent(cursor)}`: '' ) +
  //`&order_direction=${direction}` +
  `&limit=${limit}` +
  `&include_orders=false`
  return resourceUrl
}

async function testing() {
  fetch('https://api.opensea.io/api/v1/assets?collection=cryptoadz-by-gremplin&order_by=pk&cursor=LXBrPTQ3Nzg2Mzg1&order_direction=desc&limit=50&include_orders=false', options)
  .then(response => response.json())
  .then(response => {
    console.log(response);
    //cursor = response.next;
  })
  .catch(err => console.error(err));
}
//testing();

//getAsset('chainfaces-arena');

async function retrieveAssets() {


  const slug = 'cryptoadz-by-gremplin';
  const offset = 0;
  const limit = 50;
  const assets = await seaport.api.getAssets({
    'collection': slug,
    'offset': offset,
    'limit': limit,
  });
  console.log(assets);
}

async function sleep(ms){
	await new Promise(resolve => setTimeout(resolve, ms))
}
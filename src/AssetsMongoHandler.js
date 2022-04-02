// eslint-disable-next-line import/no-extraneous-dependencies
const { MongoClient } = require('mongodb');
// Connection URI
const uri = 'mongodb://10.0.0.80:27017/';
// Create a new MongoClient
const client = new MongoClient(uri);

let _database;
let _nftassets;
let _watchlists;
let connected = false;

async function connect() {
  if (connected) { return; }
  await client.connect();
  connected = true;
  _database = client.db('test');
  _nftassets = _database.collection('nftassets');
  _watchlists = _database.collection('watch_lists');
  // await update_asset('metroverse-genesis', '2')
}

// eslint-disable-next-line no-unused-vars
async function connect_main() {
  await client.connect();
  connected = true;
  _database = client.db('test');
  _nftassets = _database.collection('opensea_keys');
  const api_key = process.argv[2]
  if (await findOne({ api_key })) {
    console.log('api key found')
  } else {
    await writeOneAsset({ api_key, in_use: 'stolen' })
    console.log('new key found')
  }
  console.log(await countDocuments())
}
async function close() {
  if (connected && client) {
    connected = false;
    return client.close();
  }
  return 0
}

async function findOne(query, options) {
  checkAndThrowIfNotConnected();
  return _nftassets.findOne(query, options)
}

/**
 *
 * @param {*} query
 * @param {*} options
 * @returns a promise which returns an array.
 */
async function find(query, options) {
  checkAndThrowIfNotConnected();
  const cursor = _nftassets.find(query, options);
  return cursor.toArray();
}

async function readAssetsBySlug(slug) {
  return find({ slug });
}
async function readAssetBySlug(slug, token_id) {
  return findOne({ slug, token_id });
}

async function readWatchList() {
  return _watchlists.find().toArray();
}

async function writeOneAsset(document) {
  checkAndThrowIfNotConnected();
  // eslint-disable-next-line no-param-reassign
  delete document._id;
  return _nftassets.insertOne(document);
}

async function findAndDeleteManyAssets(query = {}) {
  checkAndThrowIfNotConnected();
  if (Object.keys(query).length === 0) {
    throw new Error('empty query - you are trying to delete all assets');
  }
  return _nftassets.deleteMany(query);
}

async function update_asset(slug, token_id) {
  _nftassets.updateOne(
    { slug, token_id },
    {
      $set:
      {
        owner: 'Bruno was right.',
      },
    },
  )
}
async function read_traits(slug) {
  checkAndThrowIfNotConnected();
  return _database.collection('trait_bids').findOne({ slug });
}

async function deleteAllAssetsWithSlug(slug) {
  if (!slug) {
    throw new Error('no slug specified');
  }
  return findAndDeleteManyAssets({ slug })
}

async function countDocuments(query) {
  checkAndThrowIfNotConnected();
  return _nftassets.countDocuments(query)
}

async function readStakingWallets(query = {}) {
  checkAndThrowIfNotConnected();
  return _database.collection('staking_wallets').find(query).toArray();
}

async function writeOneStakingWallet(document) {
  checkAndThrowIfNotConnected();
  // eslint-disable-next-line no-param-reassign
  delete document._id;
  return client.db('test').collection('staking_wallets').insertOne(document);
}

async function deleteOneStakingWallet(query) {
  checkAndThrowIfNotConnected();
  return client.db('test').collection('staking_wallets').deleteOne(query);
}

function checkAndThrowIfNotConnected() {
  if (!connected) {
    throw new Error('Did you connect the mongo client!! - Brono')
  }
}
// connect_main()
module.exports = {
  countDocuments,
  read_traits,
  find,
  findOne,
  close,
  connect,
  readStakingWallets,
  writeOneStakingWallet,
  deleteOneStakingWallet,
  readAssetsBySlug,
  readAssetBySlug,
  readAssets: find,
  readWatchList,
  update_asset,
  writeOneAsset,
  findAndDeleteManyAssets,
  deleteAllAssetsWithSlug,
}

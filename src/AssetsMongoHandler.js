const { MongoClient } = require("mongodb");
// Connection URI
const uri = "mongodb://10.0.0.80:27017/";
// Create a new MongoClient
const client = new MongoClient(uri);

let _database = undefined;
let _nftassets = undefined;
let connected = false;

async function connect() {
  await client.connect();
  connected = true;
  _database =  client.db("test");
  _nftassets = _database.collection("nftassets");
}

async function close() {
  if (client) {
    return client.close();
  }
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
  return find({ slug: slug });
}

async function writeOneAsset(document) {
  checkAndThrowIfNotConnected();
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

async function deleteAllAssetsWithSlug(slug) {
  if (!slug) {
    throw new Error('no slug specified');
  }
  return findAndDeleteManyAssets({slug: slug})
}


async function countDocuments(query) {
  checkAndThrowIfNotConnected();
  return await _nftassets.countDocuments(query)
}

async function readStakingWallets(query = {}) {
  checkAndThrowIfNotConnected();
  return _database.collection("staking_wallets").find(query).toArray();
}

async function writeOneStakingWallet(document) {
  checkAndThrowIfNotConnected();
  delete document._id;
  return client.db("test").collection("staking_wallets").insertOne(document);
}

async function deleteOneStakingWallet(query) {
  checkAndThrowIfNotConnected();
  return client.db("test").collection("staking_wallets").deleteOne(query);
}

function checkAndThrowIfNotConnected() {
  if (!connected) {
    throw new Error('Did you connect the mongo client!! - Brono')
  }
}

module.exports = {
  countDocuments,
  find,
  findOne,
  close,
  connect,
  readStakingWallets,
  writeOneStakingWallet,
  deleteOneStakingWallet,
  readAssetsBySlug,
  readAssets: find,
  writeOneAsset,
  findAndDeleteManyAssets,
  deleteAllAssetsWithSlug,
}
const { MongoClient } = require("mongodb");
// Connection URI
const uri = "mongodb://10.0.0.80:27017/";
// Create a new MongoClient
const client = new MongoClient(uri);

let _database = undefined;
let _nftassets = undefined;

async function connect() {
  await client.connect();
  _database =  client.db("test");
  _nftassets = _database.collection("nftassets");
}

async function close() {
  if (client) {
    return client.close();
  }
}

async function findOne(query, options) {
  if (!_nftassets) {
    throw new Error('Did you connect the mongo client!! - Brono')
  }
  return _nftassets.findOne(query, options)
}

async function find(query, options) {
  if (!_nftassets) {
    throw new Error('Did you connect the mongo client!! - Brono')
  }
  const cursor = _nftassets.find(query, options);
  console.log(`count: ${await cursor.count()}`)
  return cursor.toArray();
}

async function countDocuments(query) {
  if (!_nftassets) {
    throw new Error('Did you connect the mongo client!! - Brono')
  }
  return await _nftassets.countDocuments(query)
}


module.exports = {
  
  countDocuments,
  find,
  findOne,
  close,
  connect,
}
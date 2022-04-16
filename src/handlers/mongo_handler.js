/* eslint-disable max-len */
// eslint-disable-next-line import/no-extraneous-dependencies
const { MongoClient } = require('mongodb');
// Connection URI
const uri = 'mongodb://10.0.0.80:27017/';
// Create a new MongoClient
const client = new MongoClient(uri);

let _database;
let _nftassets;
let _watchlists;
let _opensea_keys;
let connected = false;

async function connect() {
  if (connected) { return; }
  await client.connect();
  connected = true;
  _database = client.db('test');
  _nftassets = _database.collection('nftassets');
  _watchlists = _database.collection('watch_lists');
  _opensea_keys = _database.collection('opensea_keys');
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

async function update_owner_asset(slug, token_id, value) {
  console.log(`${slug} ${token_id} ${value}`)
  return _nftassets.updateOne(
    { slug, token_id },
    {
      $set:
      {
        owner: value,
      },
    },
  )
}
async function update_asset_traits() {
  return 0
}
async function update_all_int_asset_traits(slug, trait_type, ranges) {
  console.log('Starting... ')
  const assets = await readAssetsBySlug(slug)
  for (const asset of assets) {
    update_int_asset_trait(slug, asset.token_id, trait_type, ranges)
  }
}
// trait_type, damage
// ranges, ['1200-1299','1300-1399', '1400-1500']
async function update_int_asset_trait(slug, token_id, trait_type, ranges) {
  const asset = await readAssetBySlug(slug, token_id)
  let value
  let value_range
  console.log(`${slug} ${token_id}`)
  for (const trait of asset.traits) {
    if (trait.trait_type.toLowerCase() === trait_type.toLowerCase()) {
      value = trait.value // 1046
    }
  }
  let match
  for (const range of ranges) {
    const temp_range_array = range.split('-')
    const min = temp_range_array[0]
    const max = temp_range_array[1]
    console.log(`${min} ${max} ${value}`)
    if (value >= min && value <= max) {
      value_range = range
      match = true
    }
  }
  if (!match) {
    return
  }
  const trait_added = {
    trait_type: `fake${trait_type}:`,
    value: value_range,
    display_type: null,
    max_value: null,
    trait_count: 26,
    order: null,
  }
  console.log('Adding... ')
  asset.traits.push(trait_added)
  const updated_traits = asset.traits
  _nftassets.updateOne(
    { slug, token_id },
    {
      $set:
      {
        traits: updated_traits,
      },
    },
  )
  console.log(`${slug} ${token_id} trait added: fake${trait_type}: ${value_range} based on: ${trait_type} ${value}`)
}
async function update_all_int_asset_traits_matching(slug, trait_type1, trait_type2, ranges1, ranges2) {
  console.log(`Starting... ${slug} ${trait_type1} ${trait_type2} ${ranges1} ${ranges2}`)
  const assets = await readAssetsBySlug(slug)
  console.log('db read complete... ')
  for (const asset of assets) {
    await update_int_asset_trait_matching(slug, asset.token_id, trait_type1, trait_type2, ranges1, ranges2)
  }
  console.log('Done... ')
}
async function update_int_asset_trait_matching(slug, token_id, trait_type1, trait_type2, ranges1, ranges2) {
  const asset = await readAssetBySlug(slug, token_id)
  let value1
  let value2
  let value_range
  for (const trait of asset.traits) {
    if (trait.trait_type.toLowerCase() === trait_type1.toLowerCase()) {
      value1 = trait.value // 1046
    }
    if (trait.trait_type.toLowerCase() === trait_type2.toLowerCase()) {
      value2 = trait.value // 1046
    }
  }
  let match1
  let match2
  for (const range of ranges1) {
    const temp_range_array = range.split('-')
    const min = temp_range_array[0]
    const max = temp_range_array[1]
    if (value1 >= min && value1 <= max) {
      value_range = range
      match1 = true
    }
  }
  if (!match1) {
    return
  }
  for (const range of ranges2) {
    const temp_range_array = range.split('-')
    const min = temp_range_array[0]
    const max = temp_range_array[1]
    if (value2 >= min && value2 <= max) {
      value_range += `:${range}`
      match2 = true
    }
  }
  if (!match2) {
    return
  }
  const trait_added = {
    trait_type: `fake${trait_type1}:${trait_type2}:`,
    value: value_range,
    display_type: null,
    max_value: null,
    trait_count: 26,
    order: null,
  }
  asset.traits.push(trait_added)
  const updated_traits = asset.traits
  _nftassets.updateOne(
    { slug, token_id },
    {
      $set:
      {
        traits: updated_traits,
      },
    },
  )
  console.log(`${slug} ${token_id} added: fake${trait_type1}:${trait_type2}: ${value_range} - ${trait_type1}:${value1} ${trait_type2}:${value2}`)
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
  // eslint-disable-next-line no-return-await
  return await _nftassets.countDocuments(query)
}

async function readStakingWallets(query = {}) {
  checkAndThrowIfNotConnected();
  return _database.collection('staking_wallets').find(query).toArray();
}
async function get_comp_wallets(query = {}) {
  checkAndThrowIfNotConnected();
  return _database.collection('comp_wallets').find(query).toArray();
}
async function get_opensea_keys(query = {}) {
  checkAndThrowIfNotConnected();
  return _database.collection('opensea_keys').find(query).toArray();
}
async function get_flash_wallets(query = {}) {
  checkAndThrowIfNotConnected();
  return _database.collection('flash_wallets').find(query).toArray();
}
async function get_our_wallets(query = {}) {
  checkAndThrowIfNotConnected();
  return _database.collection('our_wallets').find(query).toArray();
}
async function update_opensea_key(api_key) {
  _opensea_keys.updateOne(
    { api_key },
    {
      $set:
      {
        in_use: false,
      },
    },
  )
  console.log('updated')
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
  update_owner_asset,
  writeOneAsset,
  findAndDeleteManyAssets,
  deleteAllAssetsWithSlug,
  get_comp_wallets,
  get_our_wallets,
  get_flash_wallets,
  get_opensea_keys,
  update_opensea_key,
  update_int_asset_trait,
  update_all_int_asset_traits,
  update_asset_traits,
  update_int_asset_trait_matching,
  update_all_int_asset_traits_matching,
}

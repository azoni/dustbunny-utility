const mongoose = require('mongoose');
const { get_collection } = require('./handlers/opensea_handler.js');
const data = require('./data.json');

const WatchListSetItem = new mongoose.Schema({
  slug: { type: String, unique: true },
  address: String,
  tier: String,
});

const WatchListSet = mongoose.model('watch_list', WatchListSetItem);

main().catch((err) => console.log(err));

async function main() {
  try {
    await mongoose.connect('mongodb://10.0.0.80:27017/test');
    const arr = [...data.WATCH_LIST, ...data.WATCH_LIST_LOW, ...data.WALLET_SETS];
    let mySet = new Set(arr);
    mySet = Array.from(mySet);
    for (const el of mySet) {
      const col = await get_collection(el)
        .catch(() => sleep(1_300).then(() => get_collection(el)))
        .catch(() => sleep(2_000).then(() => get_collection(el)))
        .catch(() => sleep(6_000).then(() => get_collection(el)))
      console.log(col?.collection?.primary_asset_contracts?.[0]?.address);
      let w;
      try {
        w = new WatchListSet({
          slug: el,
          address: col?.collection?.primary_asset_contracts?.[0]?.address || '',
          tier: '',
        });
        await w.save();
      } catch (error) {
        console.error(`error with ${el}, may already exist`);
      }
      await sleep(600);
    }
  } finally {
    mongoose.connection.close();
  }
}

async function sleep(ms) {
  await new Promise((resolve) => { setTimeout(resolve, ms); })
}

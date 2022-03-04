const AssetMongoHandler = require("./AssetsMongoHandler.js");

async function main () {
  try {
    await AssetMongoHandler.connect();
    const query = { slug: 'bored-ape-kennel-club' };
    const options = {
      projection: { _id: 0, name: 1, slug: 1 },
    };
    //console.log(await AssetMongoHandler.countDocuments(query));
    //let s = Date.now();
    //console.log(await AssetMongoHandler.readStakingWallets());
    //let e = Date.now();
    //console.log(`${e-s}ms to get staking wallets`);

    //let p = await AssetMongoHandler.writeOneStakingWallet({
    //  "address": "0x00fake",
    //  "slug": "fake",
    //  "notes": ""
    //});
    //console.log('fake:')

    let z = await AssetMongoHandler.deleteOneStakingWallet({slug: "fake"})
    console.log(z);
    //console.log(p);
    //const s = Date.now();
    //const arr = await AssetMongoHandler.find(query, options);
    //const e = Date.now();
    //for (const el of arr) {
    //  console.log(el.name);
    //}
    //console.log(`took ${e-s}ms`)

  } finally {
    await AssetMongoHandler.close();
  }
}

main().catch(x => console.dir(x));
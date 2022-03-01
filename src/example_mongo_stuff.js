const AssetMongoHandler = require("./AssetsMongoHandler.js");

async function main () {
  try {
    await AssetMongoHandler.connect();
    const query = { slug: 'bored-ape-kennel-club' };
    const options = {
      projection: { _id: 0, name: 1, slug: 1 },
    };
    console.log(await AssetMongoHandler.countDocuments(query));
    //const s = Date.now();
    //const arr = await AssetMongoHandler.find(query, options);
    //const e = Date.now();
    //for (const el of arr) {
    //  console.log(el.name);
    //}
    //console.log(`took ${e-s}ms`)

  } finally {
    AssetMongoHandler.close();
  }
}

main().catch(x => console.dir(x));
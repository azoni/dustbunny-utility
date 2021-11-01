const values = require('./values.js')
const secret = require('./secret.js')
const opensea = require("opensea-js");
const OpenSeaPort = opensea.OpenSeaPort;
const Network = opensea.Network;

// Provider
const MnemonicWalletSubprovider = require("@0x/subproviders")
  .MnemonicWalletSubprovider;
const RPCSubprovider = require("web3-provider-engine/subproviders/rpc");
const Web3ProviderEngine = require("web3-provider-engine");
const MNEMONIC = secret.default.MNEMONIC[0]
const mnemonicWalletSubprovider = new MnemonicWalletSubprovider({
  mnemonic: MNEMONIC,
});
console.log('Collection loaded.')
//
// Get current time to determine which Infura key to use. Swaps keys every 6 hours.
//
const currentHour = new Date().getHours()
var INFURA_KEY = values.default.INFURA_KEY[Math.floor(currentHour/6)]

const infuraRpcSubprovider = new RPCSubprovider({
  rpcUrl: "https://mainnet.infura.io/v3/" + INFURA_KEY
});
const providerEngine = new Web3ProviderEngine();
providerEngine.addProvider(mnemonicWalletSubprovider);
providerEngine.addProvider(infuraRpcSubprovider);
providerEngine.start();

// Create seaport object using provider created. 
const seaport = new OpenSeaPort(
  providerEngine,
  {
    networkName: Network.Main
  },
  (arg) => console.log(arg)
);

document.getElementById('test').addEventListener('click', function(){
  
  for(var offset = 0; offset < 10000; offset+=50){
    console.log(offset)
    var collection = getCollectionDetails('winterbears', offset)
    collection.then(function(collection){
      for(var asset in collection){
        console.log(collection['assets'][asset]['tokenId'])
      }
    })
  }
})

async function getCollectionDetails(collectionName, offset){
  try {
    collectionName = collectionName.trim()
    var collect = await seaport.api.getAssets({
      'collection': collectionName,
      'offset': offset,
      'limit': '50',
      
    })
    return collect
  } catch(ex){
      console.log("couldn't get collection")

  }
}
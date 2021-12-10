  // DEFAULT_TRAIT: ['tier','cool_1'],
  // DEFAULT_EXPIRATION: 1,
  // DEFAULT_BIDS: [.8, .9],
  // DEFAULT_DELAY: 150,
  // COLLECTION_TRAIT: {
  //   'cool-cats-nft': {
  //     'tier': {
  //       'cool_1': .875,
  //       'cool_2': .9,
  //       'wild_1': .95,
  //       'wild_2': 1,
  //       'classy_1': 1.1,
  //       'classy_2': 1.15,
  //       'exotic_1': 1.2,
  //       'exotic_2': 1.25,
  //     },
  //   },
  //   'doodles-official': {
  //     'face': {
  //       'neutral note': .975,
  //       'mad note': 1.15,
  //     },
  //     'head': {
  //       'balloon': 2,
  //       'devil': 1.5,
  //     }
  //   }
  // },
  //'cf86c7bdf70f408da1d871913242202e'
const values = require('./values.js')
const secret = require('./secret.js')
const opensea = require("opensea-js")
const OpenSeaPort = opensea.OpenSeaPort;
const Network = opensea.Network;
const { WyvernSchemaName } = require('opensea-js/lib/types')
var OWNER_ADDRESS = values.default.OWNER_ADDRESS[0].address
// Provider
const MnemonicWalletSubprovider = require("@0x/subproviders")
.MnemonicWalletSubprovider;
const RPCSubprovider = require("web3-provider-engine/subproviders/rpc");
const Web3ProviderEngine = require("web3-provider-engine");
const MNEMONIC = secret.default.MNEMONIC
const mnemonicWalletSubprovider = new MnemonicWalletSubprovider({
  mnemonic: MNEMONIC,
});
console.log('Collection loaded.')
//
// Get current time to determine which Infura key to use. Swaps keys every 6 hours.
//
var currentHour = new Date().getHours()
var INFURA_KEY = values.default.INFURA_KEY[Math.floor(currentHour/3)]
if(values.default.INFURA_KEY.length === 6){
  INFURA_KEY = values.default.INFURA_KEY[Math.floor(currentHour/4)]
} else if(values.default.INFURA_KEY.length === 4){
  INFURA_KEY = values.default.INFURA_KEY[Math.floor(currentHour/6)]
}else if(values.default.INFURA_KEY.length === 5){
  INFURA_KEY = values.default.INFURA_KEY[Math.floor(currentHour/5)]
}
var infuraRpcSubprovider = new RPCSubprovider({
  rpcUrl: "https://mainnet.infura.io/v3/" + INFURA_KEY
});
var providerEngine = new Web3ProviderEngine();
providerEngine.addProvider(mnemonicWalletSubprovider);
providerEngine.addProvider(infuraRpcSubprovider);
//providerEngine.start();

if(values.default.DEFAULT_TRAIT !== undefined){
  document.getElementById('addProperty-2').value = values.default.DEFAULT_TRAIT[0]
  document.getElementById('addTrait-2').value = values.default.DEFAULT_TRAIT[1]
}
var run_count = 0
// Create seaport object using provider created. 
var seaport = new OpenSeaPort(

  providerEngine,
  {
    networkName: Network.Main,
    apiKey: values.default.API_KEY
  },
  (arg) => console.log(arg)
);

// document.getElementById('delayStart-2').addEventListener('click', function(){

// })
var infura_index = 0

document.getElementById('infurakey').addEventListener('click', function(){
  providerEngine.stop();
  INFURA_KEY = values.default.INFURA_KEY[infura_index] //[parseInt(run_count)%parseInt(values.default.INFURA_KEY.length - 1)]
  infuraRpcSubprovider = new RPCSubprovider({
    rpcUrl: "https://mainnet.infura.io/v3/" + INFURA_KEY
  });
  providerEngine = new Web3ProviderEngine();
  providerEngine.addProvider(mnemonicWalletSubprovider);
  providerEngine.addProvider(infuraRpcSubprovider);
  providerEngine.start();
  seaport = new OpenSeaPort(
    providerEngine,
    {
      networkName: Network.Main,
      apiKey: values.default.API_KEY
    },
    (arg) => console.log(arg)
  );
  infura_index += 1
  if(infura_index === values.default.INFURA_KEY.length - 1){
    infura_index = 0
  }
})
document.getElementById('increaseBid1multi-2').addEventListener('click', function(){
  

  if(document.getElementById('bidMultiplier-2').value !== ''){
    bidMultiplier = .005 + parseFloat(bidMultiplier)
    document.getElementById('bidMultiplier-2').value = bidMultiplier
    offerAmount = current_floor*(bidMultiplier - service_fee/10000)
    document.getElementById('offerAmount-2').value = offerAmount
  }
   if(document.getElementById('maxbidMultiplier-2').value !== ''){
    maxbidMultiplier = .005 + parseFloat(maxbidMultiplier)
    document.getElementById('maxbidMultiplier-2').value = maxbidMultiplier
    maxOfferAmount = current_floor*(maxbidMultiplier - service_fee/10000)
    document.getElementById('maxOfferAmount-2').value = maxOfferAmount
  }
})
document.getElementById('decreaseBidmulti-2').addEventListener('click', function(){
  
  
  if(document.getElementById('bidMultiplier-2').value !== ''){
    bidMultiplier = parseFloat(bidMultiplier) - .005
    document.getElementById('bidMultiplier-2').value = bidMultiplier
    offerAmount = current_floor*(bidMultiplier - service_fee/10000)
    document.getElementById('offerAmount-2').value = offerAmount
  }
   if(document.getElementById('maxbidMultiplier-2').value !== ''){
    maxbidMultiplier = parseFloat(maxbidMultiplier) - .005
    document.getElementById('maxbidMultiplier-2').value = maxbidMultiplier
    maxOfferAmount = current_floor*(maxbidMultiplier - service_fee/10000)
    document.getElementById('maxOfferAmount-2').value = maxOfferAmount
  }
})
document.getElementById('passivemulti-2').addEventListener('click', function(){
  bidMultiplier = .6
  maxbidMultiplier = .8
  document.getElementById('bidMultiplier-2').value = bidMultiplier
  document.getElementById('maxbidMultiplier-2').value = maxbidMultiplier
  if(document.getElementById('bidMultiplier-2').value !== ''){
    offerAmount = current_floor*(bidMultiplier - service_fee/10000)
    document.getElementById('offerAmount-2').value = offerAmount
  }
 if(document.getElementById('maxbidMultiplier-2').value !== ''){
    maxOfferAmount = current_floor*(maxbidMultiplier - service_fee/10000)
    document.getElementById('maxOfferAmount-2').value = maxOfferAmount
  }
})
document.getElementById('aggressivemulti-2').addEventListener('click', function(){
  bidMultiplier = .7
  maxbidMultiplier = .9
  document.getElementById('bidMultiplier-2').value = bidMultiplier
  document.getElementById('maxbidMultiplier-2').value = maxbidMultiplier
  if(document.getElementById('bidMultiplier-2').value !== ''){
    offerAmount = current_floor*(bidMultiplier - service_fee/10000)
    document.getElementById('offerAmount-2').value = offerAmount
  }
 if(document.getElementById('maxbidMultiplier-2').value !== ''){
    maxOfferAmount = current_floor*(maxbidMultiplier - service_fee/10000)
    document.getElementById('maxOfferAmount-2').value = maxOfferAmount
  }
})

function create_seaport(){
  providerEngine.stop();
  currentHour = new Date().getHours()
  INFURA_KEY = values.default.INFURA_KEY[Math.floor(currentHour/3)] //[parseInt(run_count)%parseInt(values.default.INFURA_KEY.length - 1)]
  if(values.default.INFURA_KEY.length === 6){
    INFURA_KEY = values.default.INFURA_KEY[Math.floor(currentHour/4)]
  } else if(values.default.INFURA_KEY.length === 4){
    INFURA_KEY = values.default.INFURA_KEY[Math.floor(currentHour/6)]
  }else if(values.default.INFURA_KEY.length === 5){
  INFURA_KEY = values.default.INFURA_KEY[Math.floor(currentHour/5)]
}
  console.log('creating seaport ' + INFURA_KEY)
  console.log(run_count)
  infuraRpcSubprovider = new RPCSubprovider({
    rpcUrl: "https://mainnet.infura.io/v3/" + INFURA_KEY
  });
  providerEngine = new Web3ProviderEngine();
  providerEngine.addProvider(mnemonicWalletSubprovider);
  providerEngine.addProvider(infuraRpcSubprovider);
  providerEngine.start();
  seaport = new OpenSeaPort(
    providerEngine,
    {
      networkName: Network.Main,
      apiKey: values.default.API_KEY
    },
    (arg) => console.log(arg)
  );
}
// const seaport2 = new OpenSeaPort(
//   providerEngine,
//   {
//     networkName: Network.Main,
//     apiKey: '1a0882610c8d48bd8751b67cc7991f21'
//   },
//   (arg) => console.log(arg)
// );
var tokenId_array = []
var name_array = []
var asset_array = []
var asset_dict = []

var NFT_CONTRACT_ADDRESS = ''
var offerAmount = 0
var maxOfferAmount = 0
var bidMultiplier = 0
var maxbidMultiplier = 0
var expirationHours = 1
if(values.default.DEFAULT_EXPIRATION !== undefined){
  document.getElementById('expireInput-2').value = values.default.DEFAULT_EXPIRATION
  expirationHours = values.default.DEFAULT_EXPIRATION
}
if(values.default.DEFAULT_BIDS !== undefined){
  document.getElementById('bidMultiplier-2').value =values.default.DEFAULT_BIDS[0]
  document.getElementById('maxbidMultiplier-2').value =values.default.DEFAULT_BIDS[1]
}
var COLLECTION_NAME = ''
var offers = 0

var stop = 0
var stop2 = 0
var halt = 0

var delay = document.getElementById('delay')
// 
// Input boxes, text, buttons from frontend. 
// 
var increaseBid = document.getElementById('increaseBid-2')
var increaseBid1 = document.getElementById('increaseBid1-2')

var blacklist = values.default.BLACK_LIST
var text = document.getElementById('text-2')
var text1 = document.getElementById('text1-2')

const collectionButton = document.getElementById('collectionButton-2')
const collectionInput = document.getElementById('collectionInput-2')
const collectionButtonClear = document.getElementById('collectionButtonClear-2')

var offersMade = document.getElementById('offersMade-2')
var confirmCollection = 0
var progressBar = document.getElementById('progressBar-2')

var current_floor = 0
var service_fee = 0
var assetCount = 0
//
// Grab collection to submit offers on. 
//
var accountIndex = 0
document.getElementById('nextAccount-2').addEventListener('click', function(){
  console.log('run-collection')
  accountIndex += 1
  if(accountIndex === values.default.OWNER_ADDRESS.length){
    accountIndex = 0
  }
  OWNER_ADDRESS = values.default.OWNER_ADDRESS[accountIndex].address
})
var fav_index = 0
getCollection(values.default.FAVORITES[fav_index])
document.getElementById('nextCollection-2').addEventListener('click', function(){
  fav_index += 1
  
  if(fav_index === values.default.FAVORITES.length){
    fav_index = 0
  }
  getCollection(values.default.FAVORITES[fav_index])
})

async function getCollection(collectionName){
  progressBar.value = 0
  collectionName = collectionName.trim()
  console.log(collectionName)
  var collect = getCollectionDetails(collectionName)
  collect.then(function(collect){
    try { 
      COLLECTION_NAME = collectionName
      document.getElementById('collectionInput-2').value = COLLECTION_NAME
      if(COLLECTION_NAME === 'guttercatgang'){
        NFT_CONTRACT_ADDRESS = '0xedb61f74b0d09b2558f1eeb79b247c1f363ae452'
      }
      if(COLLECTION_NAME === 'bears-deluxe'){
        NFT_CONTRACT_ADDRESS = '0x495f947276749ce646f68ac8c248420045cb7b5e'
      } else {
        NFT_CONTRACT_ADDRESS = collect['collection']['primary_asset_contracts'][0]['address']
      }
      console.log(collect)
      assetCount = collect['collection']['stats']['count']
      //window.open('https://opensea.io/collection/' + COLLECTION_NAME,'name','width=this.width,height=this.height')
      document.getElementById('collectionName-2').innerHTML = COLLECTION_NAME + ' ' +  collect['collection']['dev_seller_fee_basis_points'] / 100 + '% Floor: ' + collect['collection']['stats']['floor_price'].toFixed(3)
      // collection.innerHTML = NFT_CONTRACT_ADDRESS
      current_floor = collect['collection']['stats']['floor_price']
      service_fee = collect['collection']['dev_seller_fee_basis_points']
      document.getElementById('collectionImage-2').src = collect['collection'].image_url
      document.getElementById('collectionImage-2').style.height = "200px"
      document.getElementById('collectionImage-2').style.width = "200px"
      confirmCollection = 1
      document.getElementById('bidsActivity-2').innerHTML = "Bids"
      document.getElementById('bidsActivity-2').target = "_blank"
      document.getElementById('bidsActivity-2').href = 'https://opensea.io/activity/' + COLLECTION_NAME + '?collectionSlug=' + COLLECTION_NAME + '&search[isSingleCollection]=true&search[eventTypes][0]=AUCTION_SUCCESSFUL&search[eventTypes][1]=OFFER_ENTERED'
      document.getElementById('collectionHome-2').innerHTML = "Home"
      document.getElementById('collectionHome-2').target = "_blank"
      document.getElementById('collectionHome-2').href = 'https://opensea.io/collection/' + COLLECTION_NAME
      document.getElementById('assetFloor-2').innerHTML = "Floor"
      document.getElementById('assetFloor-2').target = "_blank"
      document.getElementById('assetFloor-2').href = 'https://opensea.io/collection/' + COLLECTION_NAME + '?search[sortAscending]=true&search[sortBy]=PRICE&search[toggles][0]=BUY_NOW'

    } catch(ex) {
      console.log(ex)
      document.getElementById('collectionName-2').innerHTML = ''
      document.getElementById('collectionImage-2').src = ''
      NFT_CONTRACT_ADDRESS = ''
      // collection.innerHTML = collectionName + " don't exist." + NFT_CONTRACT_ADDRESS
      confirmCollection = 0
    }
    quickButton.disabled = true
    increaseBid.disabled = true
    increaseBid1.disabled = true
      if(document.getElementById('bidMultiplier-2').value !== ''){
    offerAmount = current_floor*(bidMultiplier - service_fee/10000)
    document.getElementById('offerAmount-2').value = offerAmount
  }
 if(document.getElementById('maxbidMultiplier-2').value !== ''){
    maxOfferAmount = current_floor*(maxbidMultiplier - service_fee/10000)
    document.getElementById('maxOfferAmount-2').value = maxOfferAmount
  }
  })
}

collectionButtonClear.addEventListener('click', function(){
  COLLECTION_NAME = ''
  confirmCollection = 0
  quickButton.disabled = true
  document.getElementById('collectionName-2').innerHTML = ''
    // collection.innerHTML = 'Collection Address:'
    document.getElementById('collectionImage-2').src = 'https://cdn-images-1.medium.com/max/1200/1*U0m-Cl7qvflUX4QmdIdzoQ.png'
    document.getElementById('collectionImage-2').style.height = '200px'
    document.getElementById('collectionImage-2').style.width = '200px'
    collectionInput.value = ''
    document.getElementById('bidsActivity-2').innerHTML = ""
    document.getElementById('bidsActivity-2').target = "_blank"
    document.getElementById('bidsActivity-2').href = 'https://opensea.io/activity/' + COLLECTION_NAME + '?collectionSlug=' + COLLECTION_NAME + '&search[isSingleCollection]=true&search[eventTypes][0]=AUCTION_SUCCESSFUL&search[eventTypes][1]=OFFER_ENTERED'
    document.getElementById('collectionHome-2').innerHTML = ""
    document.getElementById('collectionHome-2').target = "_blank"
    document.getElementById('collectionHome-2').href = 'https://opensea.io/collection/' + COLLECTION_NAME
    document.getElementById('assetFloor-2').innerHTML = ""
    document.getElementById('assetFloor-2').target = "_blank"
    document.getElementById('assetFloor-2').href = 'https://opensea.io/collection/' + COLLECTION_NAME + '?search[sortAscending]=true&search[sortBy]=PRICE&search[toggles][0]=BUY_NOW'
  })

collectionButton.addEventListener('click', function(){
  getCollection(collectionInput.value)
})
// document.getElementById('api3').addEventListener('click', function(){
//   currentHour = new Date().getHours()
//   INFURA_KEY = values.default.INFURA_KEY[Math.floor(currentHour/6)]
//   delay.value = 3000
//   infuraRpcSubprovider = new RPCSubprovider({
//     rpcUrl: "https://mainnet.infura.io/v3/" + INFURA_KEY
//   });
//   providerEngine = new Web3ProviderEngine();
//   providerEngine.addProvider(mnemonicWalletSubprovider);
//   providerEngine.addProvider(infuraRpcSubprovider);
//   providerEngine.start();
//   seaport = new OpenSeaPort(
//     providerEngine,
//     {
//       networkName: Network.Main,
//       apiKey: '2f6f419a083c46de9d83ce3dbe7db601'
//     },
//     (arg) => console.log(arg)
//   );
//   console.log('swapping to public api key')
// })
// document.getElementById('api2').addEventListener('click', function(){
//   currentHour = new Date().getHours()
//   INFURA_KEY = values.default.INFURA_KEY[Math.floor(currentHour/6)]
//   delay.value = 250
//   infuraRpcSubprovider = new RPCSubprovider({
//     rpcUrl: "https://mainnet.infura.io/v3/" + INFURA_KEY
//   });
//   providerEngine = new Web3ProviderEngine();
//   providerEngine.addProvider(mnemonicWalletSubprovider);
//   providerEngine.addProvider(infuraRpcSubprovider);
//   providerEngine.start();
//   seaport = new OpenSeaPort(
//     providerEngine,
//     {
//       networkName: Network.Main,
//       apiKey: values.default.API_KEY2
//     },
//     (arg) => console.log(arg)
//   );
//   console.log('swapping to non-public api key')
// })
// document.getElementById('api1').addEventListener('click', function(){
//   currentHour = new Date().getHours()
//   INFURA_KEY = values.default.INFURA_KEY[Math.floor(currentHour/6)]
//   delay.value = 250
//   infuraRpcSubprovider = new RPCSubprovider({
//     rpcUrl: "https://mainnet.infura.io/v3/" + INFURA_KEY
//   });
//   providerEngine = new Web3ProviderEngine();
//   providerEngine.addProvider(mnemonicWalletSubprovider);
//   providerEngine.addProvider(infuraRpcSubprovider);
//   providerEngine.start();
//   seaport = new OpenSeaPort(
//     providerEngine,
//     {
//       networkName: Network.Main,
//       apiKey: values.default.API_KEY
//     },
//     (arg) => console.log(arg)
//   );
//   console.log('swapping to non-public api key')
// })
increaseBid.addEventListener('click', function(){
  offerAmount = .01 + parseFloat(offerAmount)
  document.getElementById('offerAmount-2').value = offerAmount
})
increaseBid1.addEventListener('click', function(){
  offerAmount = .001 + parseFloat(offerAmount)
  document.getElementById('offerAmount-2').value = offerAmount
})

////////////////////////////////////////////////
const confirmButton = document.getElementById('confirmButton-2')
const quickButton = document.getElementById('quickStart-2')

quickButton.disabled = true
increaseBid.disabled = true
increaseBid1.disabled = true

quickButton.addEventListener('click', function(){
  document.getElementById('body').style.background = '#90EE90'
  reset()
  start()
  progressBar.value =  0
  run_count = 0
  document.getElementById('nextCollection-2').disabled = true
  quickButton.disabled = true
  progressBar.hidden = false
  increaseBid.disabled = false
  increaseBid1.disabled = false
  progressBar.max = assetCount
  run()
  // if(tokenId_array.length !== 0){
  //   placeBid()
  //   placeBid2()
  // } else {
  //   run()
  // }
})
document.getElementById('smartStart-2').addEventListener('click', function(){
  document.getElementById('body').style.background = '#90EE90'
  reset()
  start()
  progressBar.value =  0
  document.getElementById('nextCollection-2').disabled = true
  quickButton.disabled = true
  progressBar.hidden = false
  increaseBid.disabled = false
  increaseBid1.disabled = false
  progressBar.max = assetCount
  run()
})
var offersDict = {}
if(values.default.AUTOSTART === 1){
  window.onload = function(){
  document.getElementById('confirmButton-2').click();
  document.getElementById('quickStart-2').click()
  }
}

confirmButton.addEventListener('click', function(){
  if (confirmCollection === 1) {
    var traitsDiv = document.getElementById('traitsDiv-2')
    offersDict = {}
    for (const property in traitsDiv.children) {
      try {
        if(traitsDiv.children[property].id.includes('property')){
          offersDict[traitsDiv.children[property].value] = [traitsDiv.children[parseInt(property+1)].value, traitsDiv.children[parseInt(property+2)].value]
        }
      } catch (ex) {
      }
    }
    offerAmount = document.getElementById('offerAmount-2').value
    if (document.getElementById('maxOfferAmount-2').value === ''){
      maxOfferAmount = 0
    } else {
      maxOfferAmount = document.getElementById('maxOfferAmount-2').value
    }

    expirationHours = document.getElementById('expireInput-2').value
    if(expirationHours === '') {
     expirationHours = 1
   }
   if(document.getElementById('bidMultiplier-2').value !== ''){
    bidMultiplier = document.getElementById('bidMultiplier-2').value
    
    console.log(current_floor)
    console.log(current_floor*bidMultiplier)
    console.log(current_floor*(bidMultiplier - service_fee/10000))
  
    offerAmount = current_floor*(bidMultiplier - service_fee/10000)
    
    document.getElementById('offerAmount-2').value = offerAmount
  }
  if(document.getElementById('maxbidMultiplier-2').value !== ''){
    console.log(current_floor*maxbidMultiplier)
    console.log(current_floor*(maxbidMultiplier - service_fee/10000))  
    maxbidMultiplier = document.getElementById('maxbidMultiplier-2').value
    maxOfferAmount = current_floor*(maxbidMultiplier - service_fee/10000)
    document.getElementById('maxOfferAmount-2').value = maxOfferAmount
  }
   if (offerAmount === ''){
    alert('No bid entered.')
    return
  }
  quickButton.disabled = false

  if(document.getElementById('multitrait-2').checked === true){
    var trait_dict = values.default.COLLECTION_TRAIT
    console.log(COLLECTION_NAME)
    var output = offerAmount + ' min ' + maxOfferAmount + ' max Bid for : ' + COLLECTION_NAME + " " + expirationHours + " hour expiration."
    output += '\n' + current_floor
    for(var i in trait_dict[COLLECTION_NAME]){
      console.log(i)
      for(var j in trait_dict[COLLECTION_NAME][i]){
        output += '\n' + i + ': ' + j + ' - ' + ((trait_dict[COLLECTION_NAME][i][j] - service_fee/10000) * current_floor).toFixed(4)
      }
    }
    if(values.default.AUTOSTART === 1){
      return 0
    }
    alert(output)
  } else {
    if(values.default.AUTOSTART === 1){
      return 0
    }
    alert(offerAmount + ' min ' + maxOfferAmount + ' max Bid for : ' + COLLECTION_NAME + " " + expirationHours + " hour expiration.")
  }
  

  } else {
    alert('Get valid collection first.')
  }
})

function test_run(){

}

async function getCollectionDetails(collectionName){
  try{
    const collect = await seaport.api.get('/api/v1/collection/' + collectionName)
    return collect
  } catch (ex) {
    console.log("couldn't get collection")
  }  
}
function update_floor(){
  if(COLLECTION_NAME !== ''){
    getCollectionDetails(COLLECTION_NAME).then(function (collect){
      try{
      document.getElementById('collectionName-2').innerHTML = COLLECTION_NAME + ' ' +  collect['collection']['dev_seller_fee_basis_points'] / 100 + '% Floor: ' + collect['collection']['stats']['floor_price']
      current_floor = collect['collection']['stats']['floor_price']
      service_fee = collect['collection']['dev_seller_fee_basis_points']
       if(document.getElementById('bidMultiplier-2').value !== ''){
        console.log(current_floor*bidMultiplier)
        console.log(current_floor*(bidMultiplier - service_fee/10000))
        offerAmount = current_floor*(bidMultiplier - service_fee/10000)
        document.getElementById('offerAmount-2').value = offerAmount
      }
       if(document.getElementById('maxbidMultiplier-2').value !== ''){
        console.log(current_floor*maxbidMultiplier)
        console.log(current_floor*(maxbidMultiplier - service_fee/10000))
        maxOfferAmount = current_floor*(maxbidMultiplier - service_fee/10000)
        document.getElementById('maxOfferAmount-2').value = maxOfferAmount
      }
      console.log('Floor updated: ' + collect['collection']['stats']['floor_price'])
    } catch(ex){
      console.log(ex.message)
    }
    })

  } else {
    console.log('No Collection selected.')
  }
}
text.style.fontSize = '20px'
text1.style.fontSize = '20px'
// var midrun = false


async function run(){
  // document.getElementById('toprun').checked = true
  // midrun = document.getElementById('midrun').checked 
  if(document.getElementById('delayStart-2').value !== ''){
    text.innerHTML = 'Starting in ' + document.getElementById('delayStart-2').value + ' minutes.'
    await new Promise(resolve => setTimeout(resolve, document.getElementById('delayStart-2').value * 60000));
    reset()
  }

  var direction = 'asc'
  text.innerHTML = 'Starting.....'


  var collectionName = COLLECTION_NAME.trim()
  console.log(assetCount)
  // assetCount = assetCount/2
  var offset = 0
  if(document.getElementById('secondhalf-2').checked === false){
    if(document.getElementById('firstquarter-2').checked === true){
      assetCount = Math.floor(assetCount/2)
    }
    if(document.getElementById('secondquarter-2').checked === true){
      offset += Math.floor(assetCount/4)
    }
    for(offset; offset < Math.floor(assetCount/2); offset+=50){
      if(document.getElementById('thirdquarter-2').checked === true || document.getElementById('fourthquarter-2').checked === true){
        break
      }
      if(halt === 1) {
        break
      }
      //await new Promise(resolve => setTimeout(resolve, 5000))
      try{
        var collection = await seaport.api.getAssets({
          'collection': collectionName,
          'offset': offset,
          'limit': '50',
          'order_direction': direction
        })
        console.log(collection)
        for(var asset in collection['assets']){
          if(document.getElementById('sellOrder-2').checked && document.getElementById('addProperty-2').value === ''){
            if(collection['assets'][asset]['sellOrders'] !== null){
              if(document.getElementById('aboveFloor-2').value !== ''){
                if(collection['assets'][asset]['sellOrders'][0].basePrice/1000000000000000000 < current_floor * (document.getElementById('aboveFloor-2').value)){
                  tokenId_array.push(collection['assets'][asset]['tokenId'])
                  name_array.push(collection['assets'][asset]['name'])    
                  console.log(collection['assets'][asset]['sellOrders'][0].basePrice/1000000000000000000)     
                }
              } else {
                console.log(collection['assets'][asset]['sellOrders'][0].basePrice/1000000000000000000)
                tokenId_array.push(collection['assets'][asset]['tokenId'])
                name_array.push(collection['assets'][asset]['name'])
              }     
            }
          } else {
            if(document.getElementById('addProperty-2').value !== ''){
              for(var trait in collection['assets'][asset]['traits']){
                if(collection['assets'][asset]['traits'][trait]['trait_type'].toLowerCase().includes(document.getElementById('addProperty-2').value)){
                  if(collection['assets'][asset]['traits'][trait]['value'].toLowerCase().includes(document.getElementById('addTrait-2').value)){
                    if(document.getElementById('sellOrder-2').checked){
                      if(collection['assets'][asset]['sellOrders'] !== null){
                        
                        tokenId_array.push(collection['assets'][asset]['tokenId'])
                        name_array.push(collection['assets'][asset]['name'])
                      }
                    } else{
                      tokenId_array.push(collection['assets'][asset]['tokenId'])
                      name_array.push(collection['assets'][asset]['name'])
                    }
                  }
                }
              }
            } 
            else {
              var traitfound = false
              if(document.getElementById('multitrait-2').checked === true){
                for(var trait in collection['assets'][asset]['traits']){
                  for(var p in values.default.COLLECTION_TRAIT[COLLECTION_NAME]){
                    if(collection['assets'][asset]['traits'][trait]['trait_type'].toLowerCase() === p){
                      for(var t in values.default.COLLECTION_TRAIT[COLLECTION_NAME][p]){
                        if(collection['assets'][asset]['traits'][trait]['value'].toLowerCase() === t){
                          traitfound = true
                          tokenId_array.push(collection['assets'][asset]['tokenId'])
                          name_array.push(collection['assets'][asset]['name'])
                          asset_dict[collection['assets'][asset]['tokenId']] = values.default.COLLECTION_TRAIT[COLLECTION_NAME][p][t]
                        }
                      }
                    }

                  }
                }
                  if(traitfound === false && document.getElementById('traitsonly-2').checked === false){
                    tokenId_array.push(collection['assets'][asset]['tokenId'])
                    name_array.push(collection['assets'][asset]['name'])
                  }
                  traitfound = false
                
                // if(document.getElementById('traitsonly-2') === false){
                //   tokenId_array.push(collection['assets'][asset]['tokenId'])
                //   name_array.push(collection['assets'][asset]['name'])
                // }  
              } 

              else{
                tokenId_array.push(collection['assets'][asset]['tokenId'])
                name_array.push(collection['assets'][asset]['name'])
              }
              



              
            }
          }
        }
      } catch (ex){
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log(ex)
      }
      console.log(tokenId_array.length)
      text.innerHTML = tokenId_array.length + '(' + offset + ') of ' + assetCount + ' collected'
    }
  }
  direction = 'desc'
  var temp_offset = offset
  offset = 0

  if(document.getElementById('fourthquarter-2').checked === true){
    assetCount = Math.floor(assetCount/2)
  }
  if(document.getElementById('thirdquarter-2').checked === true){
    offset += Math.floor(assetCount/4)
  }

  if(document.getElementById('firsthalf-2').checked === false){
    
    for(offset; offset < assetCount/2; offset+=50){
      if(document.getElementById('firstquarter-2').checked === true || document.getElementById('secondquarter-2').checked === true){
        break
      }
      if(halt === 1) {
        break
      }
      //await new Promise(resolve => setTimeout(resolve, 5000))
      try{
        var collection = await seaport.api.getAssets({
          'collection': collectionName,
          'offset': offset,
          'limit': '50',
          'order_direction': direction
        })
        console.log(collection)
        for(var asset in collection['assets']){
          if(document.getElementById('sellOrder-2').checked && document.getElementById('addProperty-2').value === ''){
            
            if(collection['assets'][asset]['sellOrders'] !== null){
              if(document.getElementById('aboveFloor-2').value !== ''){
                if(collection['assets'][asset]['sellOrders'][0].basePrice/1000000000000000000 < current_floor * (document.getElementById('aboveFloor-2').value)){
                  tokenId_array.push(collection['assets'][asset]['tokenId'])
                  name_array.push(collection['assets'][asset]['name'])    
                  console.log(collection['assets'][asset]['sellOrders'][0].basePrice/1000000000000000000)     
                }
              } else {
                console.log(collection['assets'][asset]['sellOrders'][0].basePrice/1000000000000000000)
                tokenId_array.push(collection['assets'][asset]['tokenId'])
                name_array.push(collection['assets'][asset]['name'])
              }
              
            }
          } else {
            if(document.getElementById('addProperty-2').value !== ''){
              for(var trait in collection['assets'][asset]['traits']){
                if(collection['assets'][asset]['traits'][trait]['trait_type'].toLowerCase().includes(document.getElementById('addProperty-2').value)){
                  if(collection['assets'][asset]['traits'][trait]['value'].toLowerCase().includes(document.getElementById('addTrait-2').value)){
                    if(document.getElementById('sellOrder-2').checked){
                      if(collection['assets'][asset]['sellOrders'] !== null){
                        
                        tokenId_array.push(collection['assets'][asset]['tokenId'])
                        name_array.push(collection['assets'][asset]['name'])
                      }
                    } else{
                      tokenId_array.push(collection['assets'][asset]['tokenId'])
                      name_array.push(collection['assets'][asset]['name'])
                    }
                  }
                }
              }
            } 
            else {
              var traitfound = false
              if(document.getElementById('multitrait-2').checked === true){
                for(var trait in collection['assets'][asset]['traits']){
                  for(var p in values.default.COLLECTION_TRAIT[COLLECTION_NAME]){
                    if(collection['assets'][asset]['traits'][trait]['trait_type'].toLowerCase() === p){
                      for(var t in values.default.COLLECTION_TRAIT[COLLECTION_NAME][p]){
                        if(collection['assets'][asset]['traits'][trait]['value'].toLowerCase() === t){
                          traitfound = true
                          tokenId_array.push(collection['assets'][asset]['tokenId'])
                          name_array.push(collection['assets'][asset]['name'])
                          asset_dict[collection['assets'][asset]['tokenId']] = values.default.COLLECTION_TRAIT[COLLECTION_NAME][p][t]
                        }
                      }
                    }

                  }
                      
                }
                  if(traitfound === false && document.getElementById('traitsonly-2').checked === false){
                    tokenId_array.push(collection['assets'][asset]['tokenId'])
                    name_array.push(collection['assets'][asset]['name'])
                  }
                  traitfound = false
              } 

              else{
                tokenId_array.push(collection['assets'][asset]['tokenId'])
                name_array.push(collection['assets'][asset]['name'])
              }
                
            }
          }
        }
      } catch (ex){
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log(ex)
      }
      console.log(tokenId_array.length)
      text.innerHTML = tokenId_array.length + '(' + (parseInt(offset) + temp_offset) + ') of ' + assetCount + ' collected'
    }
  }
  if(document.getElementById('reverse-2').checked){
    tokenId_array.reverse()
    name_array.reverse()
  }
  if(halt === 1) {
    offers = 0
    progressBar.value = 0
    maxOfferAmount = 0
    offerAmount = 0
    expirationHours = 0
    text.innerHTML = ''
    text1.innerHTML = ''
    increaseBid.disabled = true
    increaseBid1.disabled = true
    quickButton.disabled = true
    progressBar.hidden = true
    offersMade.innerHTML = ''
    tokenId_array = []
    name_array = []
    halt = 0
    return 0
  }
  assetCount = tokenId_array.length - 1
  progressBar.max = assetCount
  pause()
  reset()
  start()
  stop = 0
  stop2 = 0
  halt = 0
  console.log(asset_dict)
  //testbundlebid()
  console.log(tokenId_array)
    placeBid()
  if(values.default.API_KEY !== '2f6f419a083c46de9d83ce3dbe7db601'){// && midrun === false){
    placeBid2()
  
  }
}

function check_errors(msg){
  if(msg.includes('Insufficient balance.')){
    beep()
    beep()
    beep()
    beep()
    return 'Insufficient balance. Please wrap more ETH.'
    //alert('Insufficient balance. Please wrap more ETH.')
  }
  else if(msg.includes('Invalid JSON RPC response')){
    return 'Invalid JSON RPC response'
  }
  else if(msg.includes('This order does not have a valid bid price for the auction')){
    return 'Auction'
  }
  else if(msg.includes('API Error 404: Not found.')){
    return 'Asset not found.'
  } else if(msg.includes('Trading is not enabled for')){
    return 'Trading not enalbed on asset.'
  } else if(msg.includes('Internal server error')){
    return 'Internal server error.'
  } else if(msg.includes('Not enough token approved for trade')){
      create_seaport()
    return 'Out of Infura requests.. swappinp keys.'
  } else if(msg.includes('has too many outstanding orders.')){
    return 'Too many outstanding orders.'
  } else if(msg.includes('Bid amount is not 5.0% higher than the previous bid')){
    return 'Bid amount is not 5.0% higher than the previous bid'
  }
  return 0
}

async function placeBid(){
  create_seaport()
  run_count = run_count + 1
  console.log(INFURA_KEY)
  if(values.default.API_KEY === '2f6f419a083c46de9d83ce3dbe7db601'){// || midrun === true){
    assetCount *= 2
  }
  await new Promise(resolve => setTimeout(resolve, 2000))
  // if(maxOfferAmount !== 0 && values.default.API_KEY !== '2f6f419a083c46de9d83ce3dbe7db601' ) {
  //   delay.value = 250
  // }
  for(var i = 0; i < Math.floor(assetCount/2); i++){
    await new Promise(resolve => setTimeout(resolve, delay.value))
    var offset = 0
    if(maxOfferAmount !== 0){
      var username = 'No-User'
      // while(values.default.EVENT === 1){
      //   text.innerHTML = 'please wait'
      //   text1.innerHTML = ''
      //   await new Promise(resolve => setTimeout(resolve, 5000))
      // }
      try{
        while(values.default.EVENT === 1){
          await new Promise(resolve => setTimeout(resolve, 10000))
        }
        const order = await seaport.api.getOrders({
          asset_contract_address: NFT_CONTRACT_ADDRESS,
          token_id: tokenId_array[i],
          side: 0,
          order_by: 'eth_price',
          order_direction: 'desc',
          limit: 50
        })
        if(order['orders'].length !== 0){
          var topBid = order['orders'][0].basePrice / 1000000000000000000
          var highestBid = order['orders'][0].basePrice / 1000000000000000000
          try{
            username = order['orders'][0].makerAccount.user.username
            console.log(username)

          } catch(ex){
            username = 'No-User'
          }
          if(blacklist.includes(username) === true){
            for(var b in order['orders']){
              try{
                username = order['orders'][b].makerAccount.user.username
                console.log(username)
              } catch(ex){
                username = 'No-User'
              }
              if(blacklist.includes(username) !== true){
                topBid = order['orders'][b].basePrice / 1000000000000000000
                break
              }
            }
          }

          if(parseFloat(topBid) > parseFloat(maxOfferAmount)){
            for(var t in order['orders']){
              if(parseFloat(order['orders'][t].basePrice / 1000000000000000000) < parseFloat(maxOfferAmount)){
                try{
                  username = order['orders'][0].makerAccount.user.username
                  console.log(username)

                } catch(ex){
                  username = 'No-User'
                }
                if(blacklist.includes(username) === false){
                  topBid = order['orders'][t].basePrice / 1000000000000000000
                  break
                }
                
              }
            }
          }

          if(parseFloat(topBid) < parseFloat(maxOfferAmount) && parseFloat(topBid) >= parseFloat(offerAmount)){
            offset = .001 + parseFloat(topBid - offerAmount)
          } 

          console.log('top bid: ' + topBid + ' #' + name_array[i])
        } else {
          console.log('No bids found.')
          text1.innerHTML = 'No bids found.'
        }
        
      }
      catch(ex){
        console.log(ex.message)
        console.log('Get bids for ' + name_array[i] + ' failed.')
      }
      await new Promise(resolve => setTimeout(resolve, delay.value))
    }
    var asset = {
      tokenId: tokenId_array[i],
      tokenAddress: NFT_CONTRACT_ADDRESS,
      //schemaName: WyvernSchemaName.ERC1155
    }
    if (COLLECTION_NAME === 'bears-deluxe' || COLLECTION_NAME === 'guttercatgang'){
      asset = {
        tokenId: tokenId_array[i],
        tokenAddress: NFT_CONTRACT_ADDRESS,
        schemaName: WyvernSchemaName.ERC1155
      }      
    }
    var placebidoffer = parseFloat(offset) + parseFloat(offerAmount)
    if(document.getElementById('multitrait-2').checked === true && Object.keys(asset_dict).includes(tokenId_array[i])){
     placebidoffer = (asset_dict[tokenId_array[i]] - service_fee/10000) * current_floor
    }
    try{
      await seaport.createBuyOrder({
        asset,
        startAmount: placebidoffer,
        accountAddress: OWNER_ADDRESS,
        expirationTime: Math.round(Date.now() / 1000 + 60 * 60 * expirationHours),
      })
      console.log('Success #' + name_array[i] + ': ' + placebidoffer)
      text.style.color = 'black'
      text.innerHTML = 'bidding: ' + placebidoffer.toFixed(5) + " on " + name_array[i]
      if(maxOfferAmount !== 0){
        text1.style.color = 'black'
        text1.innerHTML = 'top bid: ' + topBid.toFixed(5) + '(' + highestBid.toFixed(5) + ')' +' #' + name_array[i]
      }
    } catch(ex){
      console.log(ex)
      console.log(ex.message)
      console.log(ex.code)
      if(ex.code === -32603){
        create_seaport()
      }
      var error_message = check_errors(ex.message)
      text.style.color = 'red'
      text.innerHTML = error_message
      if(error_message === 'Too many outstanding orders.'){
        await new Promise(resolve => setTimeout(resolve, 30000))
      }
      if(error_message === 'Insufficient balance. Please wrap more ETH.'){
        await new Promise(resolve => setTimeout(resolve, 180000))
      }
      if(error_message === 0 && halt === 0){
        text.innerHTML = 'Error.. retrying'
        console.log('**FAILED**! #' + name_array[i])
        await new Promise(resolve => setTimeout(resolve, 60000))
      }
    }
    offers+=1
    progressBar.value += 1
    offersMade.style.fontSize = '20px'
    offersMade.innerHTML = offers + '/' + progressBar.max 
    if(offers % 100 === 0) {
      update_floor()
      //buy_order()
    }
    if(halt === 1){
      break
    }
  }
  if(halt === 1){
    return 0
  }
  stop = 1
  if(stop === 1 && stop2 === 1){
    pause()
    document.getElementById('body').style.background = "#E6FBFF"
    beep()
    if(document.getElementById('repeat-2').checked){
      document.getElementById('body').style.background = '#90EE90'
      stop = 0
      stop2 = 0
      offers = 0
      progressBar.value = 0
      reset()
      start()
      placeBid()
      placeBid2()
    } 
    // else {
    //   document.getElementById('toprun').checked = false
    // }
  }
}
async function placeBid2(){
  await new Promise(resolve => setTimeout(resolve, 1000))
  // if(maxOfferAmount !== 0 && values.default.API_KEY !== '2f6f419a083c46de9d83ce3dbe7db601') {
  //   delay.value = 250
  // }
  for(var i = Math.floor(assetCount/2); i < assetCount; i++){
    await new Promise(resolve => setTimeout(resolve, delay.value))
    var offset = 0
    if(maxOfferAmount !== 0){
      var username = 'No-User'
      // while(values.default.EVENT === 1){
      //   text.innerHTML = 'please wait'
      //   text1.innerHTML = ''
      //   await new Promise(resolve => setTimeout(resolve, 5000))
      // }
      try{
        while(values.default.EVENT === 1){
          await new Promise(resolve => setTimeout(resolve, 10000))
        }
        const order = await seaport.api.getOrders({
          asset_contract_address: NFT_CONTRACT_ADDRESS,
          token_id: tokenId_array[i],
          side: 0,
          order_by: 'eth_price',
          order_direction: 'desc',
          limit: 50
        })
        if(order['orders'].length !== 0){
          var topBid = order['orders'][0].basePrice / 1000000000000000000
          var highestBid = order['orders'][0].basePrice / 1000000000000000000
          try{
            username = order['orders'][0].makerAccount.user.username
            console.log(username)

          } catch(ex){
            username = 'No-User'
          }
          if(blacklist.includes(username) === true){
            for(var b in order['orders']){
              try{
                username = order['orders'][b].makerAccount.user.username
                console.log(username)
              } catch(ex){
                username = 'No-User'
              }
              if(blacklist.includes(username) !== true){
                topBid = order['orders'][b].basePrice / 1000000000000000000
                break
              }
            }
          }
          if(parseFloat(topBid) > parseFloat(maxOfferAmount)){
            for(var t in order['orders']){
              if(parseFloat(order['orders'][t].basePrice / 1000000000000000000) < parseFloat(maxOfferAmount)){
                try{
                  username = order['orders'][0].makerAccount.user.username
                  console.log(username)

                } catch(ex){
                  username = 'No-User'
                }
                if(blacklist.includes(username) === false){
                  topBid = order['orders'][t].basePrice / 1000000000000000000
                  break
                }
                
              }
            }
          }

          if(parseFloat(topBid) < parseFloat(maxOfferAmount) && parseFloat(topBid) >= parseFloat(offerAmount)){
            offset = .001 + parseFloat(topBid - offerAmount)
          }

          console.log('top bid: ' + topBid + ' #' + name_array[i])
        } else {
          console.log('No bids found.')
          text1.innerHTML = 'No bids found.'
        }
      }
      catch(ex){
        console.log(ex.message)
        console.log('Get bids for ' + name_array[i] + ' failed.')
      }
      await new Promise(resolve => setTimeout(resolve, delay.value))
    }
    var asset = {
      tokenId: tokenId_array[i],
      tokenAddress: NFT_CONTRACT_ADDRESS,
      //schemaName: WyvernSchemaName.ERC1155
    }
    if (COLLECTION_NAME === 'bears-deluxe' || COLLECTION_NAME === 'guttercatgang'){
      asset = {
        tokenId: tokenId_array[i],
        tokenAddress: NFT_CONTRACT_ADDRESS,
        schemaName: WyvernSchemaName.ERC1155
      }      
    }
    var placebid2offer = parseFloat(offset) + parseFloat(offerAmount)
    if(document.getElementById('multitrait-2').checked === true && Object.keys(asset_dict).includes(tokenId_array[i])){
     placebid2offer = (asset_dict[tokenId_array[i]] - service_fee/10000) * current_floor
    }
    try{
      await seaport.createBuyOrder({
        asset,
        startAmount: placebid2offer,
        accountAddress: OWNER_ADDRESS,
        expirationTime: Math.round(Date.now() / 1000 + 60 * 60 * expirationHours),
      })
      console.log('Success #' + name_array[i] + ': ' + placebid2offer)
      text.style.color = 'black'
      text.innerHTML = 'bidding: ' + placebid2offer.toFixed(5) + " on " + name_array[i]
              if(maxOfferAmount !== 0){
        text1.style.color = 'black'
        text1.innerHTML = 'top bid: ' + topBid.toFixed(5) + '(' + highestBid.toFixed(5) + ')' +' #' + name_array[i]
      }
      
    } catch(ex){
      console.log(ex)
      console.log(ex.message)
      console.log(ex.code)
      if(ex.code === -32603){
        create_seaport()
      }
      var error_message = check_errors(ex.message)
      text.style.color = 'red'
      text.innerHTML = error_message
      if(error_message === 'Too many outstanding orders.'){
        await new Promise(resolve => setTimeout(resolve, 30000))
      }
      if(error_message === 'Insufficient balance. Please wrap more ETH.'){
        await new Promise(resolve => setTimeout(resolve, 180000))
      }
      if(error_message === 0 && halt === 0){
        text.innerHTML = 'Error.. retrying'
        console.log('**FAILED**! #' + name_array[i])
        await new Promise(resolve => setTimeout(resolve, 60000))
      }
    }
    offers+=1
    progressBar.value += 1
    offersMade.style.fontSize = '20px'
    offersMade.innerHTML = offers + '/' + progressBar.max 
    if(offers % 100 === 0) {
      update_floor()
      //buy_order()
    }
    if(halt === 1){
      break
    }
  }
  if(halt === 1){
    return 0
  }
  stop2 = 1
  if(stop === 1 && stop2 === 1){
    pause()
    document.getElementById('body').style.background = "#E6FBFF"
    beep()
    if(document.getElementById('repeat-2').checked){
      document.getElementById('body').style.background = '#90EE90'
      stop2 = 0
      stop = 0
      offers = 0
      progressBar.value = 0
      reset()
      start()
      placeBid()
      placeBid2()
    } 
    // else {
    //   document.getElementById('toprun').checked = false
    // }
  }
  
}
// async function buy_order(){
//   const collection_orders = []
//   const wallet_orders = ['0x3a6ae92bc396f818d87e60b0d3475ebf37b9c2ea', '0x701c1a9d3fc47f7949178c99b141c86fac72a1c4', '0x0ecbba0ccb440e0d396456bacdb3ce2a716b96e5']
  
//   try{
//     //0x3a6ae92bc396f818d87e60b0d3475ebf37b9c2ea 0-flash
//     //0x701c1a9d3fc47f7949178c99b141c86fac72a1c4 1-flash
//     //0x0ecbba0ccb440e0d396456bacdb3ce2a716b96e5 flash
//     let search_time = Math.floor(+new Date() / 1000) - 180
//     search_time = new Date(search_time).toISOString();
//     const order = await seaport.api.getOrders({
//       side: 0,
//       //order_by: 'created_date',
//       maker: '0x0ecbba0ccb440e0d396456bacdb3ce2a716b96e5',
//       listed_after: search_time,
//       limit: 50
//     })

//     var username = 'Null'
//     console.log(order.length)
//     for(var o in order['orders']){
//           try{
//           username = order['orders'][o].makerAccount.user.username
//           console.log(username)

//         } catch(ex){
//           username = 'Null'
//         }
//       if (blacklist.includes(username) !== true && parseFloat(order['orders'][o].basePrice/1000000000000000000) < maxOfferAmount && parseFloat(order['orders'][o].basePrice/1000000000000000000) > offerAmount){
//         var asset = {
//           tokenId: order['orders'][o]['asset']['tokenId'],
//           tokenAddress: NFT_CONTRACT_ADDRESS,
//           //schemaName: WyvernSchemaName.ERC1155
//         }
//         try{
//           await seaport.createBuyOrder({
//             asset,
//             startAmount: parseFloat(parseFloat(order['orders'][o].basePrice/1000000000000000000) + .001),
//             accountAddress: OWNER_ADDRESS,
//             expirationTime: Math.round(Date.now() / 1000 + 60 * 60 * expirationHours),
//           })
//           console.log(order['orders'][o]['asset']['collection']['name'] + ' ' + order['orders'][o]['asset']['tokenId'] + ' ' + order['orders'][o].basePrice/1000000000000000000)
//           console.log("upbidding flash-prpatel05 ")// + wallet_orders[wallet])
//         } catch(ex){
//           console.log(ex)
//         }

//       }
//     }
//   } catch(ex) {
//     console.log('error with buy orders')
//   }
// }
document.getElementById('reset-2').addEventListener('click', function(){ 
  reset()
  document.getElementById('assetCount').value = ''
  // document.getElementById('toprun').checked = false
  halt = 1
  offers = 0
  progressBar.value = 0
  maxOfferAmount = 0
  offerAmount = 0
  expirationHours = 0
  text.innerHTML = ''
  text1.innerHTML = ''
  increaseBid.disabled = true
  increaseBid1.disabled = true
  quickButton.disabled = true
  document.getElementById('nextCollection-2').disabled = false
  progressBar.hidden = true
  offersMade.innerHTML = ''
  tokenId_array = []
  name_array = []
})

// async function testbundlebid() {
//   for(var i in tokenId_array){
//     var a = {
//       tokenId:tokenId_array[i],
//       tokenAddress: NFT_CONTRACT_ADDRESS,
//     }
//     asset_array.push(a)
//   }
//   try{
//     await seaport.createBuyOrder({
//       asset_array,
//       startAmount: offerAmount,
//       accountAddress: OWNER_ADDRESS,
//       expirationTime: Math.round(Date.now() / 1000 + 60 * 60 * expirationHours),
//     })
//     console.log('bids made?')
//   } catch(ex){
//     console.log(ex)
//   }
// }
// Convert time to a format of hours, minutes, seconds, and milliseconds

function timeToString(time) {
  let diffInHrs = time / 3600000;
  let hh = Math.floor(diffInHrs);

  let diffInMin = (diffInHrs - hh) * 60;
  let mm = Math.floor(diffInMin);

  let diffInSec = (diffInMin - mm) * 60;
  let ss = Math.floor(diffInSec);

  let diffInMs = (diffInSec - ss) * 100;
  let ms = Math.floor(diffInMs);

  let formattedHH = hh.toString().padStart(2, "0");
  let formattedMM = mm.toString().padStart(2, "0");
  let formattedSS = ss.toString().padStart(2, "0");
  let formattedMS = ms.toString().padStart(2, "0");

  return `${formattedHH}:${formattedMM}:${formattedSS}:${formattedMS}`;
}

// Declare variables to use in our functions below

let startTime;
let elapsedTime = 0;
let timerInterval;

// Create function to modify innerHTML

function print(txt) {
  document.getElementById("display-2").innerHTML = txt;
}

// Create "start", "pause" and "reset" functions
function start() {
  startTime = Date.now() - elapsedTime;
  timerInterval = setInterval(function printTime() {
    elapsedTime = Date.now() - startTime;
    print(timeToString(elapsedTime));
  }, 10);
}

function pause() {
  clearInterval(timerInterval);
}
function reset() {
  clearInterval(timerInterval);
  print("00:00:00:00");
  elapsedTime = 0;
}
function beep() {
    var snd = new Audio("data:audio/wav;base64,//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAGDgYtAgAyN+QWaAAihwMWm4G8QQRDiMcCBcH3Cc+CDv/7xA4Tvh9Rz/y8QADBwMWgQAZG/ILNAARQ4GLTcDeIIIhxGOBAuD7hOfBB3/94gcJ3w+o5/5eIAIAAAVwWgQAVQ2ORaIQwEMAJiDg95G4nQL7mQVWI6GwRcfsZAcsKkJvxgxEjzFUgfHoSQ9Qq7KNwqHwuB13MA4a1q/DmBrHgPcmjiGoh//EwC5nGPEmS4RcfkVKOhJf+WOgoxJclFz3kgn//dBA+ya1GhurNn8zb//9NNutNuhz31f////9vt///z+IdAEAAAK4LQIAKobHItEIYCGAExBwe8jcToF9zIKrEdDYIuP2MgOWFSE34wYiR5iqQPj0JIeoVdlG4VD4XA67mAcNa1fhzA1jwHuTRxDUQ//iYBczjHiTJcIuPyKlHQkv/LHQUYkuSi57yQT//uggfZNajQ3Vmz+Zt//+mm3Wm3Q576v////+32///5/EOgAAADVghQAAAAA//uQZAUAB1WI0PZugAAAAAoQwAAAEk3nRd2qAAAAACiDgAAAAAAABCqEEQRLCgwpBGMlJkIz8jKhGvj4k6jzRnqasNKIeoh5gI7BJaC1A1AoNBjJgbyApVS4IDlZgDU5WUAxEKDNmmALHzZp0Fkz1FMTmGFl1FMEyodIavcCAUHDWrKAIA4aa2oCgILEBupZgHvAhEBcZ6joQBxS76AgccrFlczBvKLC0QI2cBoCFvfTDAo7eoOQInqDPBtvrDEZBNYN5xwNwxQRfw8ZQ5wQVLvO8OYU+mHvFLlDh05Mdg7BT6YrRPpCBznMB2r//xKJjyyOh+cImr2/4doscwD6neZjuZR4AgAABYAAAABy1xcdQtxYBYYZdifkUDgzzXaXn98Z0oi9ILU5mBjFANmRwlVJ3/6jYDAmxaiDG3/6xjQQCCKkRb/6kg/wW+kSJ5//rLobkLSiKmqP/0ikJuDaSaSf/6JiLYLEYnW/+kXg1WRVJL/9EmQ1YZIsv/6Qzwy5qk7/+tEU0nkls3/zIUMPKNX/6yZLf+kFgAfgGyLFAUwY//uQZAUABcd5UiNPVXAAAApAAAAAE0VZQKw9ISAAACgAAAAAVQIygIElVrFkBS+Jhi+EAuu+lKAkYUEIsmEAEoMeDmCETMvfSHTGkF5RWH7kz/ESHWPAq/kcCRhqBtMdokPdM7vil7RG98A2sc7zO6ZvTdM7pmOUAZTnJW+NXxqmd41dqJ6mLTXxrPpnV8avaIf5SvL7pndPvPpndJR9Kuu8fePvuiuhorgWjp7Mf/PRjxcFCPDkW31srioCExivv9lcwKEaHsf/7ow2Fl1T/9RkXgEhYElAoCLFtMArxwivDJJ+bR1HTKJdlEoTELCIqgEwVGSQ+hIm0NbK8WXcTEI0UPoa2NbG4y2K00JEWbZavJXkYaqo9CRHS55FcZTjKEk3NKoCYUnSQ0rWxrZbFKbKIhOKPZe1cJKzZSaQrIyULHDZmV5K4xySsDRKWOruanGtjLJXFEmwaIbDLX0hIPBUQPVFVkQkDoUNfSoDgQGKPekoxeGzA4DUvnn4bxzcZrtJyipKfPNy5w+9lnXwgqsiyHNeSVpemw4bWb9psYeq//uQZBoABQt4yMVxYAIAAAkQoAAAHvYpL5m6AAgAACXDAAAAD59jblTirQe9upFsmZbpMudy7Lz1X1DYsxOOSWpfPqNX2WqktK0DMvuGwlbNj44TleLPQ+Gsfb+GOWOKJoIrWb3cIMeeON6lz2umTqMXV8Mj30yWPpjoSa9ujK8SyeJP5y5mOW1D6hvLepeveEAEDo0mgCRClOEgANv3B9a6fikgUSu/DmAMATrGx7nng5p5iimPNZsfQLYB2sDLIkzRKZOHGAaUyDcpFBSLG9MCQALgAIgQs2YunOszLSAyQYPVC2YdGGeHD2dTdJk1pAHGAWDjnkcLKFymS3RQZTInzySoBwMG0QueC3gMsCEYxUqlrcxK6k1LQQcsmyYeQPdC2YfuGPASCBkcVMQQqpVJshui1tkXQJQV0OXGAZMXSOEEBRirXbVRQW7ugq7IM7rPWSZyDlM3IuNEkxzCOJ0ny2ThNkyRai1b6ev//3dzNGzNb//4uAvHT5sURcZCFcuKLhOFs8mLAAEAt4UWAAIABAAAAAB4qbHo0tIjVkUU//uQZAwABfSFz3ZqQAAAAAngwAAAE1HjMp2qAAAAACZDgAAAD5UkTE1UgZEUExqYynN1qZvqIOREEFmBcJQkwdxiFtw0qEOkGYfRDifBui9MQg4QAHAqWtAWHoCxu1Yf4VfWLPIM2mHDFsbQEVGwyqQoQcwnfHeIkNt9YnkiaS1oizycqJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");  
    snd.play();
}
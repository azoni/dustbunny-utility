const values = require('./values.js')
const secret = require('./secret.js')
const opensea = require("opensea-js")
const OpenSeaPort = opensea.OpenSeaPort;
const Network = opensea.Network;
const { WyvernSchemaName } = require('opensea-js/lib/types')
var OWNER_ADDRESS = values.default.OWNER_ADDRESS[1].address
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
    networkName: Network.Main,
    apiKey: values.default.API_KEY
  },
  (arg) => console.log(arg)
);

var tokenId_array = []
var name_array = []

var NFT_CONTRACT_ADDRESS = ''
var offerAmount = 0
var maxOfferAmount = 0
var expirationHours = 1
var COLLECTION_NAME = ''
var offers = 0

var delay = document.getElementById('delay')
// 
// Input boxes, text, buttons from frontend. 
// 
var increaseBid = document.getElementById('increaseBid-2')
var increaseBid1 = document.getElementById('increaseBid1-2')


var text = document.getElementById('text-2')

const collectionButton = document.getElementById('collectionButton-2')
const collectionInput = document.getElementById('collectionInput-2')
const collectionButtonClear = document.getElementById('collectionButtonClear-2')

var offersMade = document.getElementById('offersMade-2')
var confirmCollection = 0
var progressBar = document.getElementById('progressBar-2')

var assetCount = 0
//
// Grab collection to submit offers on. 
//
async function getCollection(collectionName){
  progressBar.value = 0
  collectionName = collectionName.trim()
  console.log(collectionName)
  var collect = getCollectionDetails(collectionName)
  collect.then(function(collect){
    try { 
      COLLECTION_NAME = collectionName
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
      document.getElementById('collectionName-2').innerHTML = COLLECTION_NAME + ' ' +  collect['collection']['dev_seller_fee_basis_points'] / 100 + '% Floor: ' + collect['collection']['stats']['floor_price']
      // collection.innerHTML = NFT_CONTRACT_ADDRESS
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
  })
}

collectionButtonClear.addEventListener('click', function(){
  COLLECTION_NAME = ''
  confirmCollection = 0
  quickButton.disabled = true
  document.getElementById('collectionName-2').innerHTML = 'Collection'
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
  start()
  progressBar.value =  0
  quickButton.disabled = true
  progressBar.hidden = false
  increaseBid.disabled = false
  increaseBid1.disabled = false
  progressBar.max = assetCount
  run()
})

var offersDict = {}
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
   if (offerAmount === ''){
    alert('No bid entered.')
    return
  }
  quickButton.disabled = false
  alert(offerAmount + ' min ' + maxOfferAmount + ' max Bid for : ' + COLLECTION_NAME + " " + expirationHours + " hour expiration.")

  } else {
    alert('Get valid collection first.')
  }
})

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
    getCollectionDetails().then(function (collect){
      try{
      document.getElementById('collectionName').innerHTML = COLLECTION_NAME + ' ' +  collect['collection']['dev_seller_fee_basis_points'] / 100 + '% Floor: ' + collect['collection']['stats']['floor_price']
      console.log('Floor updated: ' + collect['collection']['stats']['floor_price'])
    } catch(ex){
      console.log(ex.message)
    }
    })

  } else {
    console.log('No Collection selected.')
  }
}

async function run(){
  text.style.fontSize = '20px'
  text.innerHTML = 'Starting.....'
  var collectionName = COLLECTION_NAME.trim()
  console.log(assetCount)
  for(var offset = 0; offset < assetCount; offset+=50){
    //await new Promise(resolve => setTimeout(resolve, 5000))
    try{
      var collection = await seaport.api.getAssets({
        'collection': collectionName,
        'offset': offset,
        'limit': '50',
      })
      console.log(collection)
      for(var asset in collection['assets']){
        if(document.getElementById('sellOrder-2').value !== '' && document.getElementById('addProperty-2').value === ''){
          if(collection['assets'][asset]['sellOrders'] !== null){
            tokenId_array.push(collection['assets'][asset]['tokenId'])
            name_array.push(collection['assets'][asset]['name'])
          }
        } else {
          if(document.getElementById('addProperty-2').value !== ''){
            for(var trait in collection['assets'][asset]['traits']){
              if(collection['assets'][asset]['traits'][trait]['trait_type'].toLowerCase().includes(document.getElementById('addProperty-2').value)){
                if(collection['assets'][asset]['traits'][trait]['value'].toLowerCase().includes(document.getElementById('addTrait-2').value)){
                  if(document.getElementById('sellOrder-2').value !== ''){
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
            tokenId_array.push(collection['assets'][asset]['tokenId'])
            name_array.push(collection['assets'][asset]['name'])
          }
        }
      }
    } catch (ex){
      await new Promise(resolve => setTimeout(resolve, 60000));
      console.log(ex)
    }
    console.log(tokenId_array.length)
    text.innerHTML = tokenId_array.length + '(' + offset + ')' + ' of ' + assetCount + ' collected'
  }
  assetCount = tokenId_array.length - 1
  progressBar.max = assetCount
  pause()
  reset()
  start()
  placeBid()
}

function check_errors(msg){
  if(msg.includes('Insufficient balance.')){
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
  } 
  return 0
}

async function placeBid(){
  await new Promise(resolve => setTimeout(resolve, 3000))
  if(maxOfferAmount !== 0){
    delay.value = 250
  }
  for(var i = 0; i < Math.floor(assetCount); i++){
    await new Promise(resolve => setTimeout(resolve, delay.value))
    var offset = 0
    if(maxOfferAmount !== 0){
      
      try{
        const order = await seaport.api.getOrders({
          asset_contract_address: NFT_CONTRACT_ADDRESS,
          token_id: tokenId_array[i],
          side: 0,
          order_by: 'eth_price',
          order_direction: 'desc'
        })
        const topBid = order['orders'][0].basePrice / 1000000000000000000

        if(parseFloat(topBid) < parseFloat(maxOfferAmount) && parseFloat(topBid) >= parseFloat(offerAmount)){
          offset = .001 + parseFloat(topBid - offerAmount)
        }

        console.log('top bid: ' + topBid + ' #' + name_array[i])
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
    try{
      await seaport.createBuyOrder({
        asset,
        startAmount: parseFloat(offset) + parseFloat(offerAmount),
        accountAddress: OWNER_ADDRESS,
        expirationTime: Math.round(Date.now() / 1000 + 60 * 60 * expirationHours),
      })
      console.log('Success #' + name_array[i])
      text.style.color = 'black'
      text.innerHTML = 'bidding: ' + (parseFloat(offset) + parseFloat(offerAmount)).toFixed(4) + " on " + name_array[i]
    } catch(ex){
      console.log(ex)
      var error_message = check_errors(ex.message)
      text.style.color = 'red'
      console.log('**FAILED**! #' + name_array[i])
      await new Promise(resolve => setTimeout(resolve, 60000))
    }
    offers+=1
    progressBar.value += 1
    offersMade.style.fontSize = '20px'
    offersMade.innerHTML = offers + '/' + progressBar.max 
    if(offers % 100 === 0) {
      update_floor()
    }
  }
  pause()
}

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
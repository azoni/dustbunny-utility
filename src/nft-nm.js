const values = require('./values.js')
const secret = require('./secret.js')
require('./traits.js')
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
console.log('App loaded.')
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

// Set initial Owner Address.
var OWNER_ADDRESS = values.default.OWNER_ADDRESS[0].address

//Don't have one :(
//const API_KEY = process.env.API_KEY || ""; // API key is optional but useful if you're doing a high volume of requests.

//
// Creating variables needed to make offers.
//
var NFT_CONTRACT_ADDRESS = ''
var offerAmount = 0
var maxOfferAmount = 0
var expirationHours = 1
var COLLECTION_NAME = ''

//
// Handling multiple accounts on one application instance.
//
var myAccount = document.getElementById('myAccount')
var account1 = document.getElementById('account1')
var account2 = document.getElementById('account2')

account1.addEventListener('click', function(){
  OWNER_ADDRESS = values.default.OWNER_ADDRESS[0].address
  myAccount.innerHTML = values.default.OWNER_ADDRESS[0].username
  myAccount.href = 'https://opensea.io/' + values.default.OWNER_ADDRESS[0].username
})
account2.addEventListener('click', function(){
  OWNER_ADDRESS = values.default.OWNER_ADDRESS[1].address
  myAccount.innerHTML = values.default.OWNER_ADDRESS[1].username
  myAccount.href = 'https://opensea.io/' + values.default.OWNER_ADDRESS[1].username
})
myAccount.innerHTML = values.default.OWNER_ADDRESS[0].username
account1.innerHTML = values.default.OWNER_ADDRESS[0].username
account2.innerHTML = values.default.OWNER_ADDRESS[1].username

//
// Flags for threads, total offers attempted.
//
var stop = 0
var stop1 = 0
var thread1done = 0
var thread2done = 0
var offers = 0

// let callTraits = traits.default
// var result = callTraits(seaport, COLLECTION_NAME)
// console.log(result)

// 
// Input boxes, text, buttons from frontend. 
// 
var increaseBid = document.getElementById('increaseBid')
var increaseBid1 = document.getElementById('increaseBid1')
var startToken = document.getElementById('startToken')
var startToken1 = document.getElementById('startToken1')
var startToken2 = document.getElementById('startToken2')

var endToken = document.getElementById('endToken')
var endToken1 = document.getElementById('endToken1')
var endToken2 = document.getElementById('endToken2')

var text = document.getElementById('text')
var text1 = document.getElementById('text1')
var text2 = document.getElementById('text2')

const collectionButton = document.getElementById('collectionButton')
const collectionInput = document.getElementById('collectionInput')
const collectionButtonClear = document.getElementById('collectionButtonClear')

var offersMade = document.getElementById('offersMade')
var confirmCollection = 0
var progressBar = document.getElementById('progressBar')

//
// Grab collection to submit offers on. 
//
async function getCollection(collectionName){
  offers = 0
  progressBar.value = 0
  try {
    collectionName = collectionName.trim()
    const collect = await seaport.api.getAssets({
      'collection': collectionName,
      'limit': '1'
    })
    NFT_CONTRACT_ADDRESS = collect['assets'][0]['tokenAddress']
    COLLECTION_NAME = collectionName
    //window.open('https://opensea.io/collection/' + COLLECTION_NAME,'name','width=this.width,height=this.height')

    document.getElementById('collectionName').innerHTML = COLLECTION_NAME + ' ' +  collect['assets'][0]['collection']['devSellerFeeBasisPoints'] / 100 + '%'
    // collection.innerHTML = NFT_CONTRACT_ADDRESS
    document.getElementById('collectionImage').src = collect['assets'][0]['collection'].imageUrl
    document.getElementById('collectionImage').style.height = "200px"
    document.getElementById('collectionImage').style.width = "200px"
    confirmCollection = 1
    document.getElementById('bidsActivity').innerHTML = "Bids"
    document.getElementById('bidsActivity').target = "_blank"
    document.getElementById('bidsActivity').href = 'https://opensea.io/activity/' + COLLECTION_NAME + '?collectionSlug=' + COLLECTION_NAME + '&search[isSingleCollection]=true&search[eventTypes][0]=AUCTION_SUCCESSFUL&search[eventTypes][1]=OFFER_ENTERED'
    document.getElementById('collectionHome').innerHTML = "Home"
    document.getElementById('collectionHome').target = "_blank"
    document.getElementById('collectionHome').href = 'https://opensea.io/collection/' + COLLECTION_NAME
    document.getElementById('assetFloor').innerHTML = "Floor"
    document.getElementById('assetFloor').target = "_blank"
    document.getElementById('assetFloor').href = 'https://opensea.io/collection/' + COLLECTION_NAME + '?search[sortAscending]=true&search[sortBy]=PRICE&search[toggles][0]=BUY_NOW'
    if (Object.keys(favorite_dict).includes(COLLECTION_NAME)){
      document.getElementById('assetCount').value = favorite_dict[COLLECTION_NAME][0]
    } 

  } catch(ex) {
    console.log(ex)
    document.getElementById('collectionName').innerHTML = ''
    document.getElementById('collectionImage').src = ''
    NFT_CONTRACT_ADDRESS = ''
    // collection.innerHTML = collectionName + " don't exist." + NFT_CONTRACT_ADDRESS
    confirmCollection = 0
  }
  startButton.disabled = true
  quickButton.disabled = true
  increaseBid.disabled = true
  increaseBid1.disabled = true
  // buttona.disabled = true
  // buttonb.disabled = true
}

collectionButtonClear.addEventListener('click', function(){
    COLLECTION_NAME = ''
    confirmCollection = 0
    startButton.disabled = true
    quickButton.disabled = true
    document.getElementById('collectionName').innerHTML = 'Collection'
    // collection.innerHTML = 'Collection Address:'
    document.getElementById('collectionImage').src = 'https://cdn-images-1.medium.com/max/1200/1*U0m-Cl7qvflUX4QmdIdzoQ.png'
    document.getElementById('collectionImage').style.height = '200px'
    document.getElementById('collectionImage').style.width = '200px'
    collectionInput.value = ''
    document.getElementById('bidsActivity').innerHTML = ""
    document.getElementById('bidsActivity').target = "_blank"
    document.getElementById('bidsActivity').href = 'https://opensea.io/activity/' + COLLECTION_NAME + '?collectionSlug=' + COLLECTION_NAME + '&search[isSingleCollection]=true&search[eventTypes][0]=AUCTION_SUCCESSFUL&search[eventTypes][1]=OFFER_ENTERED'
    document.getElementById('collectionHome').innerHTML = ""
    document.getElementById('collectionHome').target = "_blank"
    document.getElementById('collectionHome').href = 'https://opensea.io/collection/' + COLLECTION_NAME
    document.getElementById('assetFloor').innerHTML = ""
    document.getElementById('assetFloor').target = "_blank"
    document.getElementById('assetFloor').href = 'https://opensea.io/collection/' + COLLECTION_NAME + '?search[sortAscending]=true&search[sortBy]=PRICE&search[toggles][0]=BUY_NOW'
})

collectionButton.addEventListener('click', function(){
  getCollection(collectionInput.value)
})

increaseBid.addEventListener('click', function(){
  offerAmount = .01 + parseFloat(offerAmount)
  document.getElementById('offerAmount').value = offerAmount
})
increaseBid1.addEventListener('click', function(){
  offerAmount = .001 + parseFloat(offerAmount)
  document.getElementById('offerAmount').value = offerAmount
})
var isTraits = 0
async function main(){
    text.style.fontSize = '40px'
    text.innerHTML = 'Starting.....'
    var offset = 0
    await new Promise(resolve => setTimeout(resolve, 1000));
    for(var i = startToken.value; i <= endToken.value; i++){

        if(isTraits === 1){
          try{
              const asset = await seaport.api.getAsset({
              tokenAddress: NFT_CONTRACT_ADDRESS,
              tokenId: i,
              })
            for(var trait in asset['traits']){
              if (asset['traits'][trait]['trait_type'].toLowerCase().includes('hat')){
                if(asset['traits'][trait]['value'].toLowerCase().includes('party hat')){
                  console.log(asset['traits'][trait]['value'])
                  try{
                    console.log('bidding: ' + (parseFloat(offset) + parseFloat(offerAmount)) + " on #" + i)
                    await seaport.createBuyOrder({
                    asset: {
                        tokenId: i,
                        tokenAddress: NFT_CONTRACT_ADDRESS
                    },
                    startAmount: parseFloat(offset) + parseFloat(offerAmount) ,
                    accountAddress: OWNER_ADDRESS,
                    expirationTime: Math.round(Date.now() / 1000 + 60 * 60 * expirationHours),
                    })
                    text.style.color = 'green'
                    text.innerHTML = 'Running....'
                    offers += 1
                    //document.getElementById('offersMade').innerHTML = 'Offers made: ' + offers
                } catch(ex) {
                    text.style.color = 'red'
                    text.innerHTML = 'Error......'
                    if(ex.message.includes('Insufficient balance.')){
                      alert('Insufficient balance. Please wrap more ETH.')
                    }
                    if (ex['code'] === -32603){
                      INFURA_KEY = values.default.INFURA_KEY[1]
                    }
                    console.log('**FAILED**! #' + i)
                    await new Promise(resolve => setTimeout(resolve, 3000))
                }
                offset = 0
                progressBar.value += 1
                offersMade.innerHTML = offers + '/' + progressBar.max 
                } else {
                  break
                }
              }
            }
          } catch(ex) {
            console.log(ex)
            console.log('Error with asset.')
          }
          // allow user to decide to just bid on traits or all + traits
          continue
        }

        startToken.value = i
        if (stop === 1){
          stop = 0
          break
        }
          if(maxOfferAmount !== 0){
          try{
            //const order = await seaport.api.getOrders({
            const order = await seaport.api.get('/wyvern/v1/orders', {
              asset_contract_address: NFT_CONTRACT_ADDRESS,
              token_id: i,
              side: 0,
              order_by: 'eth_price',
              order_direction: 'desc'
              //limit: '1'
            })
          const topBid = order['orders'][0].base_price / 1000000000000000000

          if(parseFloat(topBid) < parseFloat(maxOfferAmount) && parseFloat(topBid) >= parseFloat(offerAmount)){
            offset = .0001 + parseFloat(topBid - offerAmount)
          }console.log('current bid: ' + topBid + ' on #' + i)
          console.log(order)
            }
            catch(ex){
              console.log('Get bids for ' + i + ' failed.')
            }

          }
        try{
            console.log('bidding: ' + (parseFloat(offset) + parseFloat(offerAmount)) + " on #" + i)
            await seaport.createBuyOrder({
            asset: {
                tokenId: i,
                tokenAddress: NFT_CONTRACT_ADDRESS
            },
            startAmount: parseFloat(offset) + parseFloat(offerAmount) ,
            accountAddress: OWNER_ADDRESS,
            expirationTime: Math.round(Date.now() / 1000 + 60 * 60 * expirationHours),
            })
            text.style.color = 'green'
            text.innerHTML = 'Running....'
            offers += 1
            //document.getElementById('offersMade').innerHTML = 'Offers made: ' + offers
        } catch(ex) {
            text.style.color = 'red'
            text.innerHTML = 'Error......'
            if(ex.message.includes('Insufficient balance.')){
              alert('Insufficient balance. Please wrap more ETH.')
            }
            if (ex['code'] === -32603){
              INFURA_KEY = values.default.INFURA_KEY[1]
            }
            console.log('**FAILED**! #' + i)
            await new Promise(resolve => setTimeout(resolve, 5000))
        }
        offset = 0
        progressBar.value += 1
        offersMade.innerHTML = offers + '/' + progressBar.max 
    }
    text.style.color = 'purple'
    if (startToken.value === endToken.value){
      text.innerHTML = 'COMPLETE'
    } else {
      text.innerHTML = ''
    }
    thread1done = 1
    if (thread1done + thread2done  === 2){
      console.log('thread1 done')
      pause()
      document.getElementById('body').style.background = '#D9B3FF'
    }

}
 
// document.getElementById('pudgypenguins').onclick = function(){
//   getCollection('pudgypenguins')
// }
async function main1(){
    text1.style.fontSize = '40px'
    text1.innerHTML = 'Starting.....'
    var offset1 = 0
    for(var i = startToken1.value; i <= endToken1.value; i++){
        startToken1.value = i
        if (stop1 === 1){
          stop1 = 0
          break
        }
        if(maxOfferAmount !== 0){
          try{
            const order = await seaport.api.get('/wyvern/v1/orders', {
              asset_contract_address: NFT_CONTRACT_ADDRESS,
              token_id: i,
              side: 0,
              order_by: 'eth_price',
              order_direction: 'desc'
            })
          const topBid1 = order['orders'][0].base_price / 1000000000000000000
          if(parseFloat(topBid1) < parseFloat(maxOfferAmount) && parseFloat(topBid1) >= parseFloat(offerAmount)){
            offset1 = .0001 + parseFloat(topBid1 - offerAmount)
          }console.log('current bid: ' + topBid1 + ' on #' + i)
            }
            catch(ex){
              console.log('Get bids for ' + i + ' failed.')
            }
          }
        try{
            console.log('bidding: ' + (parseFloat(offset1) + parseFloat(offerAmount)) + " on #" + i)
            await seaport.createBuyOrder({
            asset: {
                tokenId: i,
                tokenAddress: NFT_CONTRACT_ADDRESS
            },
            startAmount: parseFloat(offset1) + parseFloat(offerAmount),
            accountAddress: OWNER_ADDRESS,
            expirationTime: Math.round(Date.now() / 1000 + 60 * 60 * expirationHours),
            })
            text1.style.color = 'green'
            text1.innerHTML = 'Running....'
            offers += 1.
            
            //document.getElementById('offersMade').innerHTML = 'Offers made: ' + offers
        } catch(ex) {
            text1.style.color = 'red'
            text1.innerHTML = 'Error......'
            if(ex.message.includes('Insufficient balance.')){
              alert('Insufficient balance. Please wrap more ETH.')
            }
            if (ex['code'] === -32603){
              INFURA_KEY = values.default.INFURA_KEY[2]
            }
            console.log('**FAILED**! #' + i)
            await new Promise(resolve => setTimeout(resolve, 3000))
            
        }
        offset1 = 0
        progressBar.value +=1
        offersMade.innerHTML = offers + '/' + progressBar.max 
    }
    text1.style.color = 'purple'
    if (startToken1.value === endToken1.value){
      text1.innerHTML = 'COMPLETE'
    } else {
      text2.innerHTML = ''
    }
    thread2done = 1
    if (thread1done + thread2done  === 2){
      console.log('thread2 done')
      pause()
      document.getElementById('body').style.background = '#D9B3FF'
    }
}

////////////////////////////////////////////////
const startButton = document.getElementById('startButton')
const stopButton = document.getElementById('stopButton')
const resetButton = document.getElementById('resetButton')
const confirmButton = document.getElementById('confirmButton')
const quickButton = document.getElementById('quickStart')
const apply = document.getElementById('apply')

quickButton.disabled = true
startButton.disabled = true
increaseBid.disabled = true
increaseBid1.disabled = true
// buttona.disabled = true
// buttonb.disabled = true
resetButton.addEventListener('click', function(){
    startButton.disabled = true
    quickButton.disabled = true
    text.innerHTML = ''
    text1.innerHTML = ''
    document.getElementById('assetCount').value = ''
    startToken.value = ''
    endToken.value = ''
    progressBar.max = ''
    startToken1.value = ''
    endToken1.value = ''
    offerAmount = 0
    maxOfferAmount = 0
    progressBar.hidden = true
    document.getElementById("display").innerHTML = '00:00:00'
    offersMade.innerHTML = ''
})

apply.addEventListener('click', function(){
    const startAt = document.getElementById('startAt').value
    const assetCount = document.getElementById('assetCount').value
    const section = Math.floor((assetCount-startAt) / 2)
    startToken.value = startAt
    const end = section + parseInt(startAt)
    endToken.value = end 
    startToken1.value = end + 1
    endToken1.value = assetCount
})

quickButton.addEventListener('click', function(){
  document.getElementById('body').style.background = '#90EE90'
  thread1done = 0
  thread2done = 0
  start()
  quickButton.disabled = true
  startButton.disabled = true
  progressBar.hidden = false
  increaseBid.disabled = false
  increaseBid1.disabled = false
  const startAt = document.getElementById('startAt').value
  const assetCount = document.getElementById('assetCount').value

  const section = Math.floor((assetCount-startAt) / 2)
  startToken.value = startAt
  const end = section + parseInt(startAt)
  endToken.value = end 
  startToken1.value = end + 1
  endToken1.value = assetCount
  progressBar.max = assetCount - startAt
  main()
  main1()
})

startButton.addEventListener('click', function(){
  document.getElementById('body').style.background = '#90EE90'
  thread1done = 0
  thread2done = 0
  start()
  increaseBid.disabled = false
  increaseBid1.disabled = false
  progressBar.hidden = false
  progressBar.max = parseInt(endToken.value - startToken.value) + parseInt(endToken1.value - startToken1.value) +
  parseInt(endToken2.value - startToken2.value)
  quickButton.disabled = true
  startButton.disabled = true
  main()
  if(startToken1.value !== ''){
    main1()
  } else {
    thread2done = 1
  }
})

stopButton.addEventListener('click', function(){ 
  pause()
  stop = 1
  stop1 = 1
  text.innerHTML = 'Paused'
  text1.innerHTML = 'Paused'
  increaseBid.disabled = true
  increaseBid1.disabled = true
})

var offersDict = {}
//OFFER AMOUNT SHOULD ONLY CHANGE HERE EVER
//OFFER AMOUNT SHOULD ONLY CHANGE HERE EVER
//OFFER AMOUNT SHOULD ONLY CHANGE HERE EVER
//OFFER AMOUNT SHOULD ONLY CHANGE HERE EVER
confirmButton.addEventListener('click', function(){
  if (confirmCollection === 1) {
      var traitsDiv = document.getElementById('traitsDiv')

    for (const property in traitsDiv.children) {
      try {
        if(traitsDiv.children[property].id.includes('property')){
            offersDict[traitsDiv.children[property].id] = [traitsDiv.children[property+1],traitsDiv.children[property+2]]
        }
      } catch (ex) {
        console.log(ex)
      }
    }
    console.log(offersDict)
    offerAmount = document.getElementById('offerAmount').value
    if (document.getElementById('maxOfferAmount').value === ''){
      maxOfferAmount = 0
    } else {
      maxOfferAmount = document.getElementById('maxOfferAmount').value
    }

    expirationHours = document.getElementById('expireInput').value
    if(expirationHours === '') {
       expirationHours = 1
    }
    if (offerAmount === ''){
      alert('No bid entered.')
      return
    }
    startButton.disabled = false
    quickButton.disabled = false
    alert(offerAmount + ' min ' + maxOfferAmount + ' max Bid for : ' + COLLECTION_NAME + " " + expirationHours + " hour expiration.")

  } else {
    alert('Get valid collection first.')
  }
})

///////////////////////////////////////////////
var favorites = document.getElementById('favorites')
var favorite_dict = values.default.favorites
for(var key in favorite_dict){
  const fav = key
  const collect = getCollectionDetails(fav)
  collect.then(function(collect){
    var totalAssets = favorite_dict[fav][0]
    var nodep = document.createElement('p')
    nodep.style = 'text-align: center; font-size: 14px'
    //window.open('https://opensea.io/collection/' + COLLECTION_NAME,'name','width=this.width,height=this.height')
    //console.log(collect)
    //nodep.innerHTML = fav + '<br>' + totalAssets + '<br>'
    nodep.addEventListener('click', function(){
      if (progressBar.value === 0){
        getCollection(fav)
        collectionInput.value = fav
      }
      window.scrollTo(0, 0);
    })
    var nodea = document.createElement('a')
    var nodeimg = document.createElement('img')
    var nodeaimg = document.createElement('a')
    nodeaimg.target = '_blank'
    nodeaimg.href = 'https://opensea.io/collection/' + fav
    nodep.innerHTML = fav + '<br>' + totalAssets + ' ' + (collect['assets'][0]['collection']['devSellerFeeBasisPoints'] / 100) + '%<br>'
    nodeimg.src = collect['assets'][0]['collection'].imageUrl
    // collection.innerHTML = NFT_CONTRACT_ADDRESS
    
    //nodeimg.src = favorite_dict[key][1]
    nodeimg.style.width = '180px'
    nodeimg.style.height = '180px'
    nodeaimg.appendChild(nodeimg)
    nodep.appendChild(nodeaimg)
    nodea.href = 'https://opensea.io/collection/' + fav + '?search[sortAscending]=true&search[sortBy]=PRICE&search[toggles][0]=BUY_NOW'
    nodea.target = '_blank'
    nodea.innerHTML = '<br>floor&nbsp;&nbsp;'
    nodep.appendChild(nodea)
    nodea = document.createElement('a')
    nodea.href = 'https://opensea.io/activity/' + fav + '?collectionSlug=' + fav + '&search[isSingleCollection]=true&search[eventTypes][0]=OFFER_ENTERED'
    nodea.target = '_blank'
    nodea.innerHTML = 'bids&nbsp;&nbsp;'
    nodep.appendChild(nodea)
    nodea = document.createElement('a')
    nodea.href = 'https://opensea.io/activity/' + fav + '?collectionSlug=' + fav + '&search[isSingleCollection]=true&search[eventTypes][0]=AUCTION_SUCCESSFUL'
    nodea.target = '_blank'
    nodea.innerHTML = 'sales&nbsp;'
    nodep.style.float = 'left'
    nodep.appendChild(nodea)
    favorites.appendChild(nodep)
  })
}
async function getCollectionDetails(collectionName){
  try {
    collectionName = collectionName.trim()
    const collect = await seaport.api.getAssets({
      'collection': collectionName,
      'limit': '1'
    })
    return collect
  } catch(ex){
      console.log("couldn't get collection")
  }
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

  let formattedMM = mm.toString().padStart(2, "0");
  let formattedSS = ss.toString().padStart(2, "0");
  let formattedMS = ms.toString().padStart(2, "0");

  return `${formattedMM}:${formattedSS}:${formattedMS}`;
}

// Declare variables to use in our functions below

let startTime;
let elapsedTime = 0;
let timerInterval;

// Create function to modify innerHTML

function print(txt) {
  document.getElementById("display").innerHTML = txt;
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

// function reset() {
//   clearInterval(timerInterval);
//   print("00:00:00");
//   elapsedTime = 0;
// }
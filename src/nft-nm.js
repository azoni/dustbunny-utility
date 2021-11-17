const values = require('./values.js')
const secret = require('./secret.js')
require('./traits.js')

var utils = require('./utils.js')
require('./run-collection.js')
const opensea = require("opensea-js");
const OpenSeaPort = opensea.OpenSeaPort;
const Network = opensea.Network;
const MnemonicWalletSubprovider = require("@0x/subproviders")
  .MnemonicWalletSubprovider;
const RPCSubprovider = require("web3-provider-engine/subproviders/rpc");
const Web3ProviderEngine = require("web3-provider-engine");

var myAccount = document.getElementById('myAccount')
var myAccount2 = document.getElementById('myAccount2')
// Set initial Owner Address.
var OWNER_ADDRESS = values.default.OWNER_ADDRESS[0].address
var MNEMONIC = secret.default.MNEMONIC

// web3.eth.getBalance("0x407d73d8a49eeb85d32cf465507dd71d507100c1")
// .then(console.log);
// account1.addEventListener('click', function(){
//   OWNER_ADDRESS = values.default.OWNER_ADDRESS[0].address
//   myAccount.innerHTML = values.default.OWNER_ADDRESS[0].username
//   myAccount.href = 'https://opensea.io/' + values.default.OWNER_ADDRESS[0].username
// })
// account2.addEventListener('click', function(){
//   OWNER_ADDRESS = values.default.OWNER_ADDRESS[1].address
//   myAccount.innerHTML = values.default.OWNER_ADDRESS[1].username
//   myAccount.href = 'https://opensea.io/' + values.default.OWNER_ADDRESS[1].username
// })
myAccount.innerHTML = values.default.OWNER_ADDRESS[0].username
myAccount2.innerHTML = values.default.OWNER_ADDRESS[1].username
// account1.innerHTML = values.default.OWNER_ADDRESS[0].username
// account2.innerHTML = values.default.OWNER_ADDRESS[1].username

// Provider

console.log('App loaded.')
//
// Get current time to determine which Infura key to use. Swaps keys every 6 hours.
//
var currentHour = new Date().getHours()
var INFURA_KEY = values.default.INFURA_KEY[Math.floor(currentHour/6)]

const mnemonicWalletSubprovider = new MnemonicWalletSubprovider({
  mnemonic: MNEMONIC,
});
var infuraRpcSubprovider = new RPCSubprovider({
  rpcUrl: "https://mainnet.infura.io/v3/" + INFURA_KEY
});
var providerEngine = new Web3ProviderEngine();
providerEngine.addProvider(mnemonicWalletSubprovider);
providerEngine.addProvider(infuraRpcSubprovider);
providerEngine.start();

//
// Creating variables needed to make offers.
//
var NFT_CONTRACT_ADDRESS = ''
var offerAmount = 0
var maxOfferAmount = 0
var expirationHours = 1
var COLLECTION_NAME = ''

// Create seaport object using provider created. 
var seaport = new OpenSeaPort(
  providerEngine,
  {
    networkName: Network.Main
  },
  (arg) => console.log(arg)
);
var eventDict = {}
var blacklist = values.default.BLACK_LIST
////////UPBIDBOT

function event_bid(){
  eventDict = {}
  // var events = get_current_offers()
  // events.then(function(events){
  //   Object.entries(events['winterbears']['tokens']).forEach(([key, value]) => {
  //     console.log(key, value);
  //   });
  // })
  
  var events = utils.get_current_offers_v2(COLLECTION_NAME)
  var eventBidAmount = 0
  var username = ''
  events
  .then(res => {
    Object.keys(res[COLLECTION_NAME]['tokens']).forEach( token => {
      // console.log(res['cool-cats-nft']['tokens'][token])
      // console.log(res['cool-cats-nft']['tokens'][token]['bid_amount'])
      // console.log(res['cool-cats-nft']['tokens'][token]['from']['user'])
      // console.log(res['cool-cats-nft']['tokens'][token]['address'])
      try{
        username = res[COLLECTION_NAME]['tokens'][token]['from']['user']['username']
      } catch(ex){
        username = 'Null'
      }
      if(res[COLLECTION_NAME]['tokens'][token]['bid_amount'] < maxOfferAmount && res[COLLECTION_NAME]['tokens'][token]['bid_amount'] > offerAmount && blacklist.includes(username) === false){
        //console.log(res['cool-cats-nft']['tokens'][token]['from']['user'])
        eventBidAmount = parseFloat(res[COLLECTION_NAME]['tokens'][token]['bid_amount'] + .001)
        //placeBid(token, eventBidAmount)
        eventDict[token] = eventBidAmount
        console.log('curr: ' + res[COLLECTION_NAME]['tokens'][token]['bid_amount'].toFixed(4) + ':' + username + '- bidding ' + eventBidAmount.toFixed(4) + ' on ' + token)
      } 
    })
    placeBid()
  })
  .catch(err => console.log(err))
  //console.log(eventDict)
}
//  BLACK_LIST: ['nftd00d', 'DustBunny', 'BalloonAnimal', 'E2E017', 'CakeBatter', '74b93017', 'DoughnutHole', 'ad002d', '801703', 'forbayc'],

document.getElementById('upbid_bot').addEventListener('click', function(){
  event_bid()
  console.log('events started')
})
async function placeBid(){ 
  console.log('Number to upbid: ' + Object.keys(eventDict).length)
  progressBar.value = 0
  progressBar.max = Object.keys(eventDict).length
  progressBar.hidden = false

  for(key in Object.keys(eventDict)){
    //await new Promise(resolve => setTimeout(resolve, delay.value))

    var asset = {
      tokenId: Object.keys(eventDict)[key],
      tokenAddress: NFT_CONTRACT_ADDRESS,
    }
  try{
      await seaport.createBuyOrder({
      asset,
      startAmount: eventDict[Object.keys(eventDict)[key]],
      accountAddress: values.default.OWNER_ADDRESS[0].address,
      expirationTime: Math.round(Date.now() / 1000 + 60 * 60 * expirationHours),
      })
      console.log('Bid: ' + eventDict[Object.keys(eventDict)[key]].toFixed(4) + ' on ' + Object.keys(eventDict)[key])
      document.getElementById('eventText').innerHTML = key + '/' + Object.keys(eventDict).length + ' Bid: ' + eventDict[Object.keys(eventDict)[key]].toFixed(4) + ' on ' + Object.keys(eventDict)[key]
      progressBar.value += 1
    } catch(ex){
      console.log(ex)
      await new Promise(resolve => setTimeout(resolve, 60000))
    }
  }
  if(Object.keys(eventDict).length < 20) {
  console.log('Short run')
  await new Promise(resolve => setTimeout(resolve, 120000))
  // try{

  //   const order = await seaport.api.getOrders({
  //     asset_contract_address: NFT_CONTRACT_ADDRESS,
  //     token_id: Object.keys(eventDict)[key],
  //     side: 0,
  //     order_by: 'eth_price',
  //     order_direction: 'desc'
  //   })
  //   await new Promise(resolve => setTimeout(resolve, delay.value))
  //   try {
  //     var event_username = order['orders'][0].makerAccount.user.username
  //   } catch(ex){
  //     var event_username = 'Null'
  //   }
  //   console.log(order)
  //   if(event_username === values.default.OWNER_ADDRESS[0].username){
  //     console.log('Skipping ' + Object.keys(eventDict)[key])
  //     document.getElementById('eventText').innerHTML = 'Skipping ' + Object.keys(eventDict)[key]
  //     continue
  //   }
  // }
  // catch(ex){
  //   console.log(ex.message)
  // }
  }
  if(Object.keys(eventDict).length > 20 && Object.keys(eventDict).length < 40) {
    await new Promise(resolve => setTimeout(resolve, 60000))
  }
  await new Promise(resolve => setTimeout(resolve, 2000))
  console.log('complete')
  event_bid()
  update_floor()

}

var Web3 = require('web3');
var Eth = require('web3-eth');
const provider = new Web3.providers.HttpProvider('https://mainnet.infura.io/v3/' + INFURA_KEY)
var eth = new Eth(provider)

let tokenAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
let minABI = [
  // balanceOf
  {
    "constant":true,
    "inputs":[{"name":"_owner","type":"address"}],
    "name":"balanceOf",
    "outputs":[{"name":"balance","type":"uint256"}],
    "type":"function"
  },
  // decimals
  {
    "constant":true,
    "inputs":[],
    "name":"decimals",
    "outputs":[{"name":"","type":"uint8"}],
    "type":"function"
  }
];

let contract = new eth.Contract(minABI,tokenAddress);
async function getBalance(walletAddress) {
  var balance = await contract.methods.balanceOf(walletAddress).call();
  return balance;
}
//['collection']['stats']['floor_price']
document.getElementById('update_floor').addEventListener('click', function(){
  console.log((total_weth/1000000000000000000).toFixed(4))
  update_floor()
})
function update_floor(){
  if(COLLECTION_NAME !== ''){
    getFloorPrice().then(function (collect){
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
  getBalance(values.default.OWNER_ADDRESS[0].address).then(function (result) {
  document.getElementById('balance').innerHTML = (result/1000000000000000000).toFixed(4)
  });
  getBalance(values.default.OWNER_ADDRESS[1].address).then(function (result) {
      document.getElementById('balance2').innerHTML = (result/1000000000000000000).toFixed(4)
  });

}

getBalance(values.default.OWNER_ADDRESS[0].address).then(function (result) {
    document.getElementById('balance').innerHTML = (result/1000000000000000000).toFixed(4)

});
getBalance(values.default.OWNER_ADDRESS[1].address).then(function (result) {
    document.getElementById('balance2').innerHTML = (result/1000000000000000000).toFixed(4)
});
var total_weth = 0
if(values.default.OWNER_ADDRESS[0].username==='Nftd00d'){
getBalance('0x13b451d77b87361d376ae211f640ed1a4491181d').then(function (result) {
    console.log('DustBunny: ' + (result/1000000000000000000).toFixed(4))
    total_weth += parseInt(result)
});
getBalance('0x4beac303c8fdf1f3cd34509b344067e86dcbc506').then(function (result) {
    console.log('balloonanimal: ' + (result/1000000000000000000).toFixed(4))
    total_weth += parseInt(result)
});
getBalance('0x0a85b0be9574a86b526e1f99cc6a3f2ad30baa65').then(function (result) {
    console.log('cakebatter: ' + (result/1000000000000000000).toFixed(4))
    total_weth += parseInt(result)
});
getBalance('0x60bf609e0e8b724dc61ffee24737af15a6f6d905').then(function (result) {
    console.log('doughnuthole: ' + (result/1000000000000000000).toFixed(4))
    total_weth += parseInt(result)
});
getBalance('0x774a4a3c3130e4850a84dc8c80945dee4de2e017').then(function (result) {
    console.log('DE2E017: ' + (result/1000000000000000000).toFixed(4))
    total_weth += parseInt(result)
});
getBalance('0x1484d9ae6d590d6b0981e802f555a8dd74b93017').then(function (result) {
    console.log('T74b93017: ' + (result/1000000000000000000).toFixed(4))
    total_weth += parseInt(result)
});
getBalance('0x41899a097dac875318bf731e5f4a972544ad002d').then(function (result) {
    console.log('Sad002d: ' + (result/1000000000000000000).toFixed(4))
    total_weth += parseInt(result)
});
getBalance('0x873da8e14fd648b763fe896caa41935e17801703').then(function (result) {
    console.log('Ti801703: ' + (result/1000000000000000000).toFixed(4))
    total_weth += parseInt(result)
});
getBalance('0xd76654102c5f3c27886d5b3ec47b3111e18d8126').then(function (result) {
    console.log('nftd00d: ' + (result/1000000000000000000).toFixed(4))
    total_weth += parseInt(result)
});
//
// Flags for threads, total offers attempted.
//
}
var thread1done = 0
var thread2done = 0
var offers = 0

// 
// Input boxes, text, buttons from frontend. 
// 
var increaseBid = document.getElementById('increaseBid')
var increaseBid1 = document.getElementById('increaseBid1')
var startToken = document.getElementById('startToken')
var startToken1 = document.getElementById('startToken1')

var endToken = document.getElementById('endToken')
var endToken1 = document.getElementById('endToken1')

var text = document.getElementById('text')
var text1 = document.getElementById('text1')

const collectionButton = document.getElementById('collectionButton')
const collectionInput = document.getElementById('collectionInput')
const collectionButtonClear = document.getElementById('collectionButtonClear')

var offersMade = document.getElementById('offersMade')
var confirmCollection = 0
var progressBar = document.getElementById('progressBar')

var delay = document.getElementById('delay')
delay.value = 500

document.getElementById('addDelay').addEventListener('click', function(){
  delay.value = parseInt(delay.value) + 100
  //document.getElementById('delay').value = offerAmount
})
document.getElementById('minusDelay').addEventListener('click', function(){
  delay.value -= 100
  //document.getElementById('delay').value = offerAmount
})
//
// Grab collection to submit offers on. 
//
async function getCollection(collectionName){
  offers = 0
  progressBar.value = 0
  collectionName = collectionName.trim()
  console.log(collectionName)
  var collect = getCollectionDetails(collectionName)
  collect.then(function(collect){
  try { 
      COLLECTION_NAME = collectionName
      console.log(collect)
      NFT_CONTRACT_ADDRESS = collect['collection']['primary_asset_contracts'][0]['address']
      
      //window.open('https://opensea.io/collection/' + COLLECTION_NAME,'name','width=this.width,height=this.height')

      document.getElementById('collectionName').innerHTML = COLLECTION_NAME + ' ' +  collect['collection']['dev_seller_fee_basis_points'] / 100 + '% Floor: ' + collect['collection']['stats']['floor_price']
      // collection.innerHTML = NFT_CONTRACT_ADDRESS
      document.getElementById('collectionImage').src = collect['collection'].image_url
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
        document.getElementById('assetCount').value = collect['collection']['stats']['count']
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
  })
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
async function main(){

    text.style.fontSize = '20px'
    text.innerHTML = 'Starting.....'
    var offset = 0
    await new Promise(resolve => setTimeout(resolve, 3000));
    for(var i = startToken.value; i <= endToken.value; i++){
    await new Promise(resolve => setTimeout(resolve, delay.value))
    var bidMade = 0
    if(Object.keys(offersDict).length > 0){
          try{
              const asset = await seaport.api.getAsset({
              tokenAddress: NFT_CONTRACT_ADDRESS,
              tokenId: i,
              })
            for(var trait in asset['traits']){
              if (asset['traits'][trait]['trait_type'].toLowerCase().includes(Object.keys(offersDict)[0])){
                if(asset['traits'][trait]['value'].toLowerCase().includes(offersDict[Object.keys(offersDict)[0]][0])){
                  try{
                    console.log(asset['traits'][trait]['value'] + ': ' + offersDict[Object.keys(offersDict)[0]][1] + " on #" + i)
                    await seaport.createBuyOrder({
                    asset: {
                        tokenId: i,
                        tokenAddress: NFT_CONTRACT_ADDRESS
                    },
                    startAmount: offersDict[Object.keys(offersDict)[0]][1],
                    accountAddress: OWNER_ADDRESS,
                    expirationTime: Math.round(Date.now() / 1000 + 60 * 60 * expirationHours),
                    })
                    text.style.color = 'black'
                    text.innerHTML = asset['traits'][trait]['value'] + ': ' + offersDict[Object.keys(offersDict)[0]][1] + " on #" + i
                    offers += 1
                    //document.getElementById('offersMade').innerHTML = 'Offers made: ' + offers
                } catch(ex) {
                    text.style.color = 'red'
                    text.innerHTML = 'Error......'
                    if(ex.message.includes('Insufficient balance.')){
                      text.innerHTML = 'Insufficient balance. Please wrap more ETH.'
                      //alert('Insufficient balance. Please wrap more ETH.')
                    }
                    console.log('**FAILED**! #' + i)
                    await new Promise(resolve => setTimeout(resolve, 3000))
                }
                offset = 0
                progressBar.value += 1
                offersMade.innerHTML = offers + '/' + progressBar.max
                bidMade = 1
                } else {
                  await new Promise(resolve => setTimeout(resolve, 1000))
                  break
                }
              }
            }
          } catch(ex) {
            console.log(ex)
            console.log('Error with asset.')
          }
          // allow user to decide to just bid on traits or all + traits
          if (bidMade === 1) {
            continue
          }
        }

        startToken.value = i

        if(maxOfferAmount !== 0){
          try{
            //const order = await seaport.api.getOrders({
            const order = await seaport.api.getOrders({
              asset_contract_address: NFT_CONTRACT_ADDRESS,
              token_id: i,
              side: 0,
              order_by: 'eth_price',
              order_direction: 'desc'
              //limit: '1'
            })
            const topBid = order['orders'][0].basePrice / 1000000000000000000

            if(parseFloat(topBid) < parseFloat(maxOfferAmount) && parseFloat(topBid) >= parseFloat(offerAmount)){
              offset = .001 + parseFloat(topBid - offerAmount)
            }
            // if(order['orders'][0].makerAccount.user.username === myAccount.innerHTML || parseFloat(topBid) > parseFloat(maxOfferAmount)){
            //   offset = 0
            //   progressBar.value += 1
            //   offersMade.innerHTML = offers + '/' + progressBar.max 
            //   console.log('skipping ' + i)

            //   await new Promise(resolve => setTimeout(resolve, 600))
            //   offers += 1
            //   continue
            // }
            // console.log(order)
            console.log('top bid: ' + topBid + ' #' + i)
          }
          catch(ex){
            await new Promise(resolve => setTimeout(resolve, 5000))
            console.log('Get bids for ' + i + ' failed.')
          }
          await new Promise(resolve => setTimeout(resolve, delay.value))
        }
        try{
            console.log('bidding: ' + (parseFloat(offset) + parseFloat(offerAmount)).toFixed(5) + " on #" + i)
            await seaport.createBuyOrder({
            asset: {
                tokenId: i,
                tokenAddress: NFT_CONTRACT_ADDRESS
            },
            startAmount: parseFloat(offset) + parseFloat(offerAmount) ,
            accountAddress: OWNER_ADDRESS,
            expirationTime: Math.round(Date.now() / 1000 + 60 * 60 * expirationHours),
            })
            text.style.color = 'black'
            text.innerHTML = 'bidding: ' + (parseFloat(offset) + parseFloat(offerAmount)).toFixed(5) + " on #" + i
            offers += 1
            //document.getElementById('offersMade').innerHTML = 'Offers made: ' + offers
        } catch(ex) {
            text.style.color = 'red'
            text.innerHTML = 'Error......'
            if(ex.message.includes('Insufficient balance.')){
              text.innerHTML = 'Insufficient balance. Please wrap more ETH.'
              //alert('Insufficient balance. Please wrap more ETH.')
            }
            console.log('**FAILED**! #' + i)
            await new Promise(resolve => setTimeout(resolve, 60000))
        }
        offset = 0
        progressBar.value += 1

        offersMade.style.fontSize = '20px'
        offersMade.innerHTML = offers + '/' + progressBar.max 
        if(offers / 100 === 0){
          update_floor()
        }
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
function check_errors(msg){
  if(msg.includes('Insufficient balance.')){
    return 'Insufficient balance. Please wrap more ETH.'
    //alert('Insufficient balance. Please wrap more ETH.')
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

async function main1(){
    text1.style.fontSize = '20px'
    text1.innerHTML = 'Starting.....'
    var offset1 = 0

    for(var i = endToken1.value; i >= startToken1.value; i--){
        await new Promise(resolve => setTimeout(resolve, delay.value))
          var bidMade = 0
        if(Object.keys(offersDict).length > 0){
          try{
              const asset = await seaport.api.getAsset({
              tokenAddress: NFT_CONTRACT_ADDRESS,
              tokenId: i,
              })
            for(var trait in asset['traits']){
              if (asset['traits'][trait]['trait_type'].toLowerCase().includes(Object.keys(offersDict)[0])){
                if(asset['traits'][trait]['value'].toLowerCase().includes(offersDict[Object.keys(offersDict)[0]][0])){
                  try{
                    console.log(asset['traits'][trait]['value'] + ': ' + offersDict[Object.keys(offersDict)[0]][1] + " on #" + i)
                    await seaport.createBuyOrder({
                    asset: {
                        tokenId: i,
                        tokenAddress: NFT_CONTRACT_ADDRESS
                    },
                    startAmount: offersDict[Object.keys(offersDict)[0]][1],
                    accountAddress: OWNER_ADDRESS,
                    expirationTime: Math.round(Date.now() / 1000 + 60 * 60 * expirationHours),
                    })
                    text1.style.color = 'black'
                    text1.innerHTML = asset['traits'][trait]['value'] + ': ' + offersDict[Object.keys(offersDict)[0]][1] + " on #" + i
                    offers += 1
                    //.toFixed(5)
                    //document.getElementById('offersMade').innerHTML = 'Offers made: ' + offers
                } catch(ex) {
                    var error_message = check_errors(ex.message)
                    text1.style.color = 'red'
                    text1.innerHTML = 'Error......'
                    text1.innerHTML = error_message
                    // if(ex.message.includes('Insufficient balance.')){
                    //   text1.innerHTML = 'Insufficient balance. Please wrap more ETH.'
                    //   //alert('Insufficient balance. Please wrap more ETH.')
                    //   await new Promise(resolve => setTimeout(resolve, 60000))
                    // }
                    // else if(ex.message.includes('This order does not have a valid bid price for the auction')){
                    //   text1.innerHTML = 'Auction'
                    // }
                    // else if(ex.message.includes('API Error 404: Not found.')){
                    //   text1.innerHTML = 'Asset not found.'
                    // } else if(ex.message.includes('Trading is not enabled for')){
                    //   text1.innerHTML = 'Trading no enalbed on asset.'
                    // } 
                    // else {
                    //   await new Promise(resolve => setTimeout(resolve, 60000))
                    // }     
                    if(error_message === 0){
                      await new Promise(resolve => setTimeout(resolve, 60000))
                    }
                    else if(error_message === 'Insufficient balance. Please wrap more ETH.')
                    {
                      await new Promise(resolve => setTimeout(resolve, 300000))
                    }
                     else {
                      text1.innerHTML = error_message
                    }               
                    console.log('**FAILED**! #' + i)
                }
                offset1 = 0
                progressBar.value += 1
                //offersMade.innerHTML = offers + '/' + progressBar.max
                bidMade = 1
                } else {
                  await new Promise(resolve => setTimeout(resolve, 1000))
                  break
                }
              }
            }
          } catch(ex) {
            console.log(ex)
            console.log('Error with asset.')
          }
          // allow user to decide to just bid on traits or all + traits
          if (bidMade === 1) {
            continue
          }
        }
        endToken1.value = i

        if(maxOfferAmount !== 0){
          try{
            const order = await seaport.api.getOrders({
              asset_contract_address: NFT_CONTRACT_ADDRESS,
              token_id: i,
              side: 0,
              order_by: 'eth_price',
              order_direction: 'desc'
            })
          const topBid1 = order['orders'][0].basePrice / 1000000000000000000
          if(parseFloat(topBid1) < parseFloat(maxOfferAmount) && parseFloat(topBid1) >= parseFloat(offerAmount)){
            offset1 = .001 + parseFloat(topBid1 - offerAmount)
          }
          // if(order['orders'][0].makerAccount.user.username === myAccount.innerHTML || parseFloat(topBid1) > parseFloat(maxOfferAmount)){
          //   offset1 = 0
          //   progressBar.value += 1
          //   offersMade.innerHTML = offers + '/' + progressBar.max 
          //   console.log('skipping ' + i)

          //   await new Promise(resolve => setTimeout(resolve, 600))
          //   offers += 1
          //   continue
          // }
          // console.log(order)
          console.log('top bid: ' + topBid1 + ' #' + i)
            }//order['orders'][0].makerAccount.user.username + 
            catch(ex){
              await new Promise(resolve => setTimeout(resolve, 5000))
              console.log('Get bids for ' + i + ' failed.')
            }
            await new Promise(resolve => setTimeout(resolve, delay.value))
          }
        try{
            console.log('bidding: ' + (parseFloat(offset1) + parseFloat(offerAmount)).toFixed(5) + " on #" + i)
            await seaport.createBuyOrder({
            asset: {
                tokenId: i,
                tokenAddress: NFT_CONTRACT_ADDRESS
            },
            startAmount: parseFloat(offset1) + parseFloat(offerAmount),
            accountAddress: OWNER_ADDRESS,
            expirationTime: Math.round(Date.now() / 1000 + 60 * 60 * expirationHours),
            })
            text1.style.color = 'black'
            text1.innerHTML = 'bidding: ' + (parseFloat(offset1) + parseFloat(offerAmount)).toFixed(5) + " on #" + i
            offers += 1
            
            //document.getElementById('offersMade').innerHTML = 'Offers made: ' + offers
        } catch(ex) {
            text1.style.color = 'red'
            text1.innerHTML = 'Error......'
            if(ex.message.includes('Insufficient balance.')){
              text1.innerHTML = 'Insufficient balance. Please wrap more ETH.'
              //alert('Insufficient balance. Please wrap more ETH.')
            }
            if(ex.message.includes('API Error 404: Not found.')){
              text1.innerHTML = 'Asset not found.'
              //alert('Insufficient balance. Please wrap more ETH.')
            } else {
              await new Promise(resolve => setTimeout(resolve, 60000))
            }
            console.log(ex.message)
            console.log('**FAILED**! #' + i)
            
            
        }
        offset1 = 0
        progressBar.value +=1
        //offersMade.innerHTML = offers + '/' + progressBar.max 
    }
    text1.style.color = 'purple'
    if (startToken1.value === endToken1.value){
      text1.innerHTML = 'COMPLETE'
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
// const stopButton = document.getElementById('stopButton')
const resetButton = document.getElementById('reset')
const confirmButton = document.getElementById('confirmButton')
const quickButton = document.getElementById('quickStart')
// const apply = document.getElementById('apply')

quickButton.disabled = true
startButton.disabled = true
increaseBid.disabled = true
increaseBid1.disabled = true
// buttona.disabled = true
// buttonb.disabled = true
// resetButton.addEventListener('click', function(){
//     startButton.disabled = true
//     quickButton.disabled = true
//     text.innerHTML = ''
//     text1.innerHTML = ''
//     document.getElementById('assetCount').value = ''
//     startToken.value = ''
//     endToken.value = ''
//     progressBar.max = ''
//     startToken1.value = ''
//     endToken1.value = ''
//     offerAmount = 0
//     maxOfferAmount = 0
//     progressBar.hidden = true
//     document.getElementById("display").innerHTML = '00:00:00'
//     offersMade.innerHTML = ''
// })

// apply.addEventListener('click', function(){
//     const startAt = document.getElementById('startAt').value
//     const assetCount = document.getElementById('assetCount').value
//     const section = Math.floor((assetCount-startAt) / 2)
//     startToken.value = startAt
//     const end = section + parseInt(startAt)
//     endToken.value = end 
//     startToken1.value = end + 1
//     endToken1.value = assetCount
// })

quickButton.addEventListener('click', function(){
  const startAt = document.getElementById('startAt').value
  var assetCount = document.getElementById('assetCount').value
  document.getElementById('body').style.background = '#90EE90'
  thread1done = 0
  thread2done = 0
  start()
  progressBar.value =  0
  offers = 0
  quickButton.disabled = true
  startButton.disabled = true
  progressBar.hidden = false
  increaseBid.disabled = false
  increaseBid1.disabled = false

  if(assetCount === '10000'){
    assetCount -= 1
    console.log('busted')
  }
  console.log(assetCount)
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
  progressBar.value = 0
  start()
  increaseBid.disabled = false
  increaseBid1.disabled = false
  progressBar.hidden = false
  progressBar.max = parseInt(endToken.value - startToken.value) + parseInt(endToken1.value - startToken1.value)
  quickButton.disabled = true
  startButton.disabled = true
  main()
  if(startToken1.value !== ''){
    main1()
  } else {
    thread2done = 1
  }
})

resetButton.addEventListener('click', function(){ 
  reset()
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
  startButton.disabled = true
  progressBar.hidden = true

})

var offersDict = {}
var traitsList = []
//OFFER AMOUNT SHOULD ONLY CHANGE HERE EVER
//OFFER AMOUNT SHOULD ONLY CHANGE HERE EVER
//OFFER AMOUNT SHOULD ONLY CHANGE HERE EVER
//OFFER AMOUNT SHOULD ONLY CHANGE HERE EVER
confirmButton.addEventListener('click', function(){
  if (confirmCollection === 1) {
      var traitsDiv = document.getElementById('traitsDiv')
      offersDict = {}
      traitsList = []
    for (const property in traitsDiv.children) {
      try {
        //console.log(traitsDiv.children[property])
        if(traitsDiv.children[property].id.includes('property')){
          console.log(traitsDiv.children[property].value)
          traitsList.push(traitsDiv.children[property].value)
          console.log(property)
          traitsList.push(traitsDiv.children[parseInt(property+1)].value)
          traitsList.push(traitsDiv.children[parseInt(property+2)].value)
          // traitsList.push({
          //   'property': traitsDiv.children[property].value,
          //   'trait': traitsDiv.children[parseInt(property+1)].value, 
          //   'bid': traitsDiv.children[parseInt(property+2)].value
          // })
          //offersDict[traitsDiv.children[parseInt(property)].value] = [traitsDiv.children[parseInt(property+1)].value, traitsDiv.children[parseInt(property+2)].value]
        }
      } catch (ex) {
      }
    }
    
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
  console.log(traitsList)
})

///////////////////////////////////////////////
var favorites = document.getElementById('favorites')
var favorite_dict = values.default.favorites
for(var key in favorite_dict){
  const fav = key
  const collect = getCollectionDetails(fav)

  collect.then(function(collect){
    //var totalAssets = favorite_dict[fav][0]
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
    try {
    var current_floor = collect['collection']['stats']['floor_price']
    nodep.innerHTML = fav + ' ' + current_floor + '<br>' + collect['collection']['stats']['count'] + ' ' + (collect['collection']['dev_seller_fee_basis_points'] / 100) + '%<br>'
    } catch(ex){
      return
    }
    nodeimg.src = collect['collection'].image_url
    // collection.innerHTML = NFT_CONTRACT_ADDRESS
    // console.log(collect)
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
  try{  
    const collect = await seaport.api.get('/api/v1/collection/' + collectionName)
    return collect
  } catch (ex) {
    console.log("couldn't get collections")
  }  
}

// document.getElementById('updateFloor').addEventListener('click', function(COLLECTION_NAME){
//   document.getElementById('updateFloor').innerHTML = getFloorPrice(COLLECTION_NAME)
// })

async function getFloorPrice(){
    try{
    const collect = await seaport.api.get('/api/v1/collection/' + COLLECTION_NAME)
    return collect
  } catch (ex) {
    console.log("couldn't get floor")
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

function reset() {
  clearInterval(timerInterval);
  print("00:00:00:00");
  elapsedTime = 0;
}
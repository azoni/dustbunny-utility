const values = require('./values.js')
const data = require('./data.js')
const secret = require('./secret.js')
require('./traits.js')
const cool_cat_traits = require('./coolcats.js')
var utils = require('./utils.js')
require('./run-collection.js')
require('./run-collection-mid.js')
const opensea = require("opensea-js");
const { WyvernSchemaName } = require('opensea-js/lib/types')
const OpenSeaPort = opensea.OpenSeaPort;
const Network = opensea.Network;
const MnemonicWalletSubprovider = require("@0x/subproviders")
  .MnemonicWalletSubprovider;
const RPCSubprovider = require("web3-provider-engine/subproviders/rpc");
const Web3ProviderEngine = require("web3-provider-engine");
//teacuppig1234 d0fc2dfb800045358e70548d71176469-
//charltonsmith f934d4e8e2af46b38c60826c4fde1afa-
//janeejacobsen 8dfb7126fa454b3a9d3b48f0435qaeb8c05--
//joecurry c2941943ae8341dca396d5dc49426f92-
var myAccount = document.getElementById('myAccount')
var myAccount2 = document.getElementById('myAccount2')
// Set initial Owner Address.
var OWNER_ADDRESS = values.default.OWNER_ADDRESS[1].address
var MNEMONIC = secret.default.MNEMONIC
//BLACK_LIST: ['DrBurry', 'DustBunny', 'BalloonAnimal', 'DE2E017', 'CakeBatter', 'T74b93017', 'DoughnutHole', 'ad002d', 'Ti801703'],
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
myAccount.innerHTML = values.default.OWNER_ADDRESS[1].username
myAccount2.innerHTML = values.default.OWNER_ADDRESS[0].username
document.getElementById('myAccountbottom').innerHTML = values.default.OWNER_ADDRESS[1].username
// account1.innerHTML = values.default.OWNER_ADDRESS[0].username
// account2.innerHTML = values.default.OWNER_ADDRESS[1].username

// Provider
var stop = 0
var stop2 = 0
//
// Get current time to determine which Infura key to use. Swaps keys every 6 hours.
//

    // var msg = new SpeechSynthesisUtterance();
    // msg.text = 'api key pause ' + values.default.API_KEY
    // window.speechSynthesis.speak(msg);
    // msg.text = 'alchemy key pause ' + values.default.ALCHEMY_KEY
    // window.speechSynthesis.speak(msg);
    // msg.text = 'infura key pause ' + values.default.INFURA_KEY[0]
    // window.speechSynthesis.speak(msg);
    // msg.text = 'next infura key pause ' + values.default.INFURA_KEY[1]
    // window.speechSynthesis.speak(msg);
    // msg.text = 'next infura key pause ' + values.default.INFURA_KEY[2]
    // window.speechSynthesis.speak(msg);
    // msg.text = 'next infura key pause ' + values.default.INFURA_KEY[3]
    // window.speechSynthesis.speak(msg);

const mnemonicWalletSubprovider = new MnemonicWalletSubprovider({
  mnemonic: MNEMONIC,
});
var provider_string = ''
if(values.default.ALCHEMY_KEY !== undefined){
  provider_string = 'https://eth-mainnet.alchemyapi.io/v2/' + values.default.ALCHEMY_KEY
} else {
  var currentHour = new Date().getHours()
  var INFURA_KEY = values.default.INFURA_KEY[Math.floor(currentHour/3)]
  if(values.default.INFURA_KEY.length === 6){
    INFURA_KEY = values.default.INFURA_KEY[Math.floor(currentHour/4)]
  } else if(values.default.INFURA_KEY.length === 4){
    INFURA_KEY = values.default.INFURA_KEY[Math.floor(currentHour/6)]
  }else if(values.default.INFURA_KEY.length === 5){
    INFURA_KEY = values.default.INFURA_KEY[Math.floor(currentHour/5)]
  }
  provider_string = "https://mainnet.infura.io/v3/" + INFURA_KEY
}
var infuraRpcSubprovider = new RPCSubprovider({
  rpcUrl: provider_string//"https://mainnet.infura.io/v3/" + INFURA_KEY
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
//dustpan 7146f835781e4638b8e8cebf21d8a396
//dustbunny 1a0882610c8d48bd8751b67cc7991f21
//04903a94a949443f96061e0046b034c7 event ping janesmitheliz@gmail.com
// Create seaport object using provider created. 
var seaport = new OpenSeaPort(
  providerEngine,
  {
    networkName: Network.Main,
    apiKey: values.default.API_KEY
  },
  (arg) => console.log(arg)
);

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
  console.log('creating seaport ' + values.default.API_KEY)
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
if(values.default.TITLE === 'Home1'){
  current_running()
}

async function current_running(){
  let search_time = Math.floor(+new Date()) - 180
  search_time = new Date(search_time).toISOString();
  await new Promise(resolve => setTimeout(resolve, 3000))
  console.log('Current running accounts...')
  for(var address in values.default.OWNER_ADDRESS){
    await new Promise(resolve => setTimeout(resolve, 1000))
   //console.log(address) 
    try{
      const order = await seaport.api.getOrders({
        side: 0,
        order_by: 'created_date',
        maker: values.default.OWNER_ADDRESS[address].address,
        listed_after: search_time,
        limit: 1,
      })
      if(order.orders.length > 0){
        console.log(values.default.OWNER_ADDRESS[address].username + ' ' + order.orders[0].asset.collection.slug)
      }
    }
    catch(ex) {
      console.log(ex.message)
    }
  }
  console.log('Complete') 
}

var eventDict = {}
var blacklist = values.default.BLACK_LIST
////////UPBIDBOT
//  INFURA_KEY: ['55b37dd4e48b49cb8c5f9e90445088a1', '9e30b32ca14a408c99ae890ac2c8e8dc', '1bac20c89d97488491bad84f22d7a15b', '231011f146004bd1927eaf77c8b69aac'],
// document.getElementById('readme').addEventListener('click', function(){
//   alert("Welcome to the latest version of DustBunny — your local liquidity provider" + "\nTop(A) runs on 2 threads\n" + "Bottom(B) runs on a more optimized single thread but is about 30% slower than A\n" + "New features:\n" + "Cycle through accounts using the >> button before account name\n" + "Hide B to move Event bids up for easier access\n"+"Not 100% sure it works or buggy…\n"+
//   "- Infura swap\n"+
//   "- Reset Button\n"+
  

// "Recently added\n"+

// "Loop checkbox will run the same set of assets continuously\n"+
//   "- Changes to bids, expiration can be made during run, direction cannot\n"+
//   "- Can toggle loop on and off\n"+
// "Reverse checkbox to run the collection in reverse\n"+
//   "-Once started cannot be undone\n"+

// "Next:\n"+
//   "Add inputs for event bidding -- works through values file right now.\n"+
//   "Multi-trait bidding\n"+
//   "Sample WALLET_SETS for event bidding\n"+
//   "WALLET_SETS: {\n"+
//   " 'cool-cats-nft': '0x4beac303c8fdf1f3cd34509b344067e86dcbc506',\n"+
//   " 'doodles-official': '0x41899a097dac875318bf731e5f4a972544ad002d',\n" +
//   "},")
// })
hide_mid()
document.getElementById('hidemid').addEventListener('click', function(){
  hide_mid()
})
function hide_mid(){
  if(document.getElementById('hidemid').innerHTML === 'Show'){
    document.getElementById('hidemid').innerHTML = "Hide"
    document.getElementById('midui').style.display = 'block';
  } else {
   document.getElementById('midui').style.display = 'none';
   document.getElementById('hidemid').innerHTML = 'Show'   
  }
}
hide_bottom()
document.getElementById('hidebottom').addEventListener('click', function(){
  hide_bottom()
})
function hide_bottom(){
  if(document.getElementById('hidebottom').innerHTML === 'Show'){
    document.getElementById('hidebottom').innerHTML = "Hide"
    document.getElementById('bottomui').style.display = 'block';
  } else {
   document.getElementById('bottomui').style.display = 'none';
   document.getElementById('hidebottom').innerHTML = 'Show'   
  }
}
var infura_index = 0
try{
  document.getElementById('infurakey').innerHTML = 'Inufra(' + values.default.INFURA_KEY.length + ')'
} catch(ex){
  console.log('no infura keys found')
}
document.getElementById('infurakey').addEventListener('click', function(){
  providerEngine.stop();
  INFURA_KEY = values.default.INFURA_KEY[infura_index] //[parseInt(run_count)%parseInt(values.default.INFURA_KEY.length - 1)]
  console.log('creating seaport ' + INFURA_KEY)
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
function event_bid(){
  reset()
  start()
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
document.getElementById('listed_bot').addEventListener('click', function(){
  //event_bid()
  console.log('Listed started')
  listed_bid()
  offersMade.innerHTML = ''
  document.getElementById('topui').hidden = true
  document.getElementById('favorites').hidden = true
})

async function listed_bid(){
  reset()
  start()
  text.innerHTML = ''
  text1.innerHTML = ''
  text.style = 'text-align: left; font-size: 30px; padding-left: 5%'
  text1.style = 'text-align: left; font-size: 30px; padding-left: 5%'
  document.getElementById('body').style.background = '#ffc1cc'
  if(document.getElementById('event_window').value === ''){
    event_window = 180000
  } else {
    event_window = document.getElementById('event_window').value * 1000
  }
  var start_time = Math.floor(+new Date() / 1000)
  expiration = .5
  if(document.getElementById('event-expiration').value !== ''){
    expiration = document.getElementById('event-expiration').value
  }
  var event_multi = .9
  if(document.getElementById('event-multiplier').value !== ''){
    event_multi = document.getElementById('event-multiplier').value
  }
  let search_time = Math.floor(+new Date()) - event_window
  let search_time2 = Math.floor(+new Date())
  search_time = new Date(search_time).toISOString();
  search_time2 = new Date(search_time2).toISOString();
  var offset = 0
  var counter = 0
  var skip = 0
  var watch_list = values.default.WATCH_LIST//, 'boredapeyachtclub']
  var watch_list_low = values.default.WATCH_LIST_LOW
  var watch_list_high = values.default.WATCH_LIST_HIGH
  do {
    if(event_stop === 1){
          break
      }
    try{
      await new Promise(resolve => setTimeout(resolve, 750))
      const order = await seaport.api.getOrders({
        side: 1,
        order_by: 'created_date', 
        limit: 50,
        listed_after: search_time,
        listed_before: search_time2,
        offset: offset
      })
      var order_length = order['orders'].length
      
      //console.log(order)
      for(var o in order.orders){
        try{
          if(order.orders[o].makerAccount.user.username === 'veemaster42069' || order.orders[o].makerAccount.user.username === 'KJ1AA'){
            continue
          }
          var extra_minus = 0
          var extra_plus = 0
          if(watch_list_low.includes(order.orders[o].asset.collection.slug)){
            extra_minus = .05
          }
          if(watch_list_high.includes(order.orders[o].asset.collection.slug)){
            extra_plus = .05
          }
          if(watch_list.includes(order.orders[o].asset.collection.slug) 
            || watch_list_low.includes(order.orders[o].asset.collection.slug)
            || watch_list_high.includes(order.orders[o].asset.collection.slug)){

            counter += 1
            console.log(order.orders[o].asset.collection.slug + ' ' + order.orders[o].asset.tokenId + ' ' + order.orders[o].currentPrice/1000000000000000000)
            //console.log(order.orders[o].currentPrice/1000000000000000000)
            //console.log('---bids')
            const asset = await seaport.api.getAsset({
              tokenAddress: order.orders[o].asset.tokenAddress,
              tokenId: order.orders[o].asset.tokenId,
            })
             for(var trait in asset.traits){
              console.log(asset.traits[trait].trait_type + ' ' + asset.traits[trait].value)
              
            }
            const collect = await seaport.api.get('/api/v1/collection/' + order['orders'][o]['asset']['collection']['slug'])
            var floor_price = collect['collection']['stats']['floor_price']
            var min_flooroffer = floor_price * ((event_multi - .05 - extra_minus + extra_plus) - collect['collection']['dev_seller_fee_basis_points']/10000)
            var flooroffer = floor_price * ((event_multi - extra_minus + extra_plus) - collect['collection']['dev_seller_fee_basis_points']/10000)
            var top_bid = asset.buyOrders[0].basePrice/1000000000000000000
            var curr_bid = 0

            // account for currency type
            // check for auction
            if(order.orders[o].currentPrice/1000000000000000000 < floor_price*.8 && order.orders[o].paymentTokenContract.name === "Ether"){
              beep()
              beep()
              beep()
              beep()
              beep()
              await new Promise(resolve => setTimeout(resolve, 1000))
              beep()
              beep()
              beep()
              beep()
              text1.innerHTML = 'BUY ALERT ' + order.orders[o].asset.name
              window.open("https://opensea.io/assets/" + order.orders[o].asset.tokenAddress + '/' + order.orders[o].asset.tokenId);
            }

           
            for(var bid in asset.buyOrders){
              try{
                if(asset.buyOrders[bid].makerAccount.user.username === 'DrBurry'){
                  continue
                } 
              }catch(e) {

                }
              
              curr_bid = asset.buyOrders[bid].basePrice/1000000000000000000
              if(curr_bid > top_bid){
                top_bid = curr_bid
              }
              // if(asset.buyOrders[bid].basePrice/1000000000000000000 > flooroffer){
              //   console.log(asset.buyOrders[bid].basePrice/1000000000000000000)
              // }
              
            }


            console.log('Top Bid: ' + top_bid + ' Offer: ' + flooroffer)
            console.log(order.orders[o])
            console.log(asset)
            console.log(collect.collection.stats.count)


            if(top_bid < flooroffer){
              flooroffer = parseFloat(top_bid) + parseFloat(.01)
            } else {
              text.innerHTML += '<br><img width=200px height=200px src=' + order.orders[o].asset.imageUrl + '><img> '
              text.innerHTML += ' Floor: ' + floor_price  + ' Price: ' + order.orders[o].currentPrice/1000000000000000000 + ' <span style="color:#8510d8">SKIPPED</span> (' + top_bid.toFixed(3) + ') <a target=_blank href=https://opensea.io/assets/' + order.orders[o].asset.tokenAddress + '/' + order.orders[o].asset.tokenId + '>' + order.orders[o].asset.collection.slug + ' ' + order.orders[o].asset.tokenId + "<a> "
              window.scrollTo(0,document.body.scrollHeight);
              skip += 1
              continue
            }
            if(flooroffer < min_flooroffer || top_bid < min_flooroffer){
              flooroffer = min_flooroffer
            }
           if(asset.buyOrders.length === 0){
              flooroffer = min_flooroffer
            }
            var ass = {
              tokenId: order.orders[o].asset.tokenId,
              tokenAddress: order.orders[o].asset.tokenAddress,
            }
            if (order['orders'][o]['asset']['collection']['slug'] === 'bears-deluxe' || order['orders'][o]['asset']['collection']['slug'] === 'guttercatgang' || order['orders'][o]['asset']['collection']['slug'] === 'clonex-mintvial'){
              ass = {
                tokenId: order['orders'][o]['asset']['tokenId'],
                tokenAddress: order['orders'][o]['asset']['tokenAddress'],
                schemaName: WyvernSchemaName.ERC1155
              }      
            }
            var bid_address = values.default.EVENT_WALLET
            if(order.orders[o].asset.collection.slug === 'boredapeyachtclub'){
              bid_address = values.default.BAYC
            }

            await seaport.createBuyOrder({
              asset: ass,
              startAmount: flooroffer,
              accountAddress: bid_address,
              expirationTime: Math.round(Date.now() / 1000 + 60 * 60 * expiration),
            })
            console.log('Price: ' + order.orders[o].currentPrice/1000000000000000000 + ' Bid: ' + flooroffer + ' on ' + order.orders[o].asset.name)
            text.innerHTML += '<br><img width=200px height=200px src=' + order.orders[o].asset.imageUrl + '><img> '
            text.innerHTML += ' Floor: ' + floor_price  + ' Price: ' + order.orders[o].currentPrice/1000000000000000000 + ' Bid: ' + flooroffer.toFixed(4) + ' on <a target=_blank href=https://opensea.io/assets/' + order.orders[o].asset.tokenAddress + '/' + order.orders[o].asset.tokenId + '>' + order.orders[o].asset.collection.slug + ' ' + order.orders[o].asset.tokenId + "<a> "
            window.scrollTo(0,document.body.scrollHeight);
            //console.log(asset.buyOrders)
            //console.log(asset.traits)
          }
        } catch(e){
          if(e.message.includes('Cannot read properties of')){
            console.log('pass')
          }else{
            console.log(e.message)
          }
        }
      }
      
    } catch(e){
      if(e.message.includes('Cannot read properties of undefined')){
        console.log('pass')
      }else{
        console.log(e.message)
      }
      
    }
    
    offset += 50
  } while(order_length === 50)
  text1.innerHTML = 'Complete - ' + (counter - skip) + ' bids made ' + skip + ' skipped'
  console.log(parseInt(offset) + order_length)
  console.log(counter)
  var end_time = Math.floor(+new Date() / 1000)

  //check for being upbid here

  if (end_time - start_time < event_window/1000){
    await new Promise(resolve => setTimeout(resolve, (event_window/1000 - (end_time - start_time)) * 1000))
  }
  listed_bid()
}

//  BLACK_LIST: ['nftd00d', 'DustBunny', 'BalloonAnimal', 'E2E017', 'CakeBatter', '74b93017', 'DoughnutHole', 'ad002d', '801703', 'forbayc'],
// document.getElementById('api1').innerHTML = values.default.API_KEY.substring(0, 5)
// document.getElementById('api2').innerHTML = values.default.API_KEY2.substring(0, 5)
document.getElementById('upbid_bot').addEventListener('click', function(){
  //event_bid()
  console.log('events started')
  buy_order()
  offersMade.innerHTML = ''
  event_stop = 0
})
document.getElementById('stop-upbid_bot').addEventListener('click', function(){
  event_stop = 1
  pause()
  text.innerHTML = ''
  text1.innerHTML = ''
})
var counter = 0
var event_stop = 0
var eventbidcount = 0
var event_window = 0
var expiration = 1
var wallet_set = values.default.WALLET_SETS
var wallet_orders = data.default.COMP_WALLETS
async function buy_order(){
  if(document.getElementById('event_window').value === ''){
    event_window = 180000
  } else {
    event_window = document.getElementById('event_window').value * 1000
  }
  var start_time = Math.floor(+new Date() / 1000)
  // kj_8 ['0xd9453e907ac6ea8a276a9534ec39e1550e674848']

  if(document.getElementById('event_wallet').value !== ''){
    wallet_orders = [document.getElementById('event_wallet').value]
  }

  if(document.getElementById('event_collection').value !== ''){
    var collect_set = document.getElementById('event_collection').value
    wallet_set = {}
    wallet_set[collect_set] = OWNER_ADDRESS

  }
  reset()
  start()
    text.style.fontSize = '20px'
    text.innerHTML = 'Starting.....'
    offersMade.style.fontSize = '20px'
    text1.style.fontSize = '20px'
    //0x3a6ae92bc396f818d87e60b0d3475ebf37b9c2ea 0-flash
    //0x701c1a9d3fc47f7949178c99b141c86fac72a1c4 1-flash
    //0x0ecbba0ccb440e0d396456bacdb3ce2a716b96e5 flash
    //0xfdb32c8ddda21172a031d928056e19725a0836c5 2flash
    //0xdc3b7ef263f1cdaa25ffa93c642639f5f4f2a669 3flash
    console.log(event_window)
    console.log(Math.floor(+new Date()))
    let search_time = Math.floor(+new Date()) - event_window
    let search_time2 = Math.floor(+new Date())
    search_time = new Date(search_time).toISOString();
    search_time2 = new Date(search_time2).toISOString();
    console.log(search_time)
    counter = 0
    var order_array = []
    values.default.EVENT = 1
    for(var wallet in wallet_orders){
      var offset = 0
      var event_multi = .9
      if(document.getElementById('event-multiplier').value !== ''){
        event_multi = document.getElementById('event-multiplier').value
      }
      expiration = 1
      if(document.getElementById('event-expiration').value !== ''){
        expiration = document.getElementById('event-expiration').value
      }
      do{
        await new Promise(resolve => setTimeout(resolve, 500))
        var order_length = 0
      try{
      if(values.default.API_KEY === '2f6f419a083c46de9d83ce3dbe7db601'){
        
        values.default.BID = 1
        values.default.API_KEY = values.default.API_KEY2
        create_seaport()
        await new Promise(resolve => setTimeout(resolve, 3000))
      }
      
      const order = await seaport.api.getOrders({
        side: 0,
        order_by: 'created_date',
        maker: wallet_orders[wallet],
        listed_after: search_time,
        listed_before: search_time2,
        limit: 50,
        offset: offset
      })
      
      text.innerHTML = 'Getting wallet: ' + (parseInt(wallet) + 1) + '(' + wallet_orders.length + ') ' + wallet_orders[wallet]
      text1.innerHTML = counter + ' bids made'
      var username = 'Null'
      if(order['orders'].length === 0){
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
      try{
        username = order['orders'][0].makerAccount.user.username
        console.log(username)

      } catch(ex){
        username = 'Null'
      }
     if(event_stop === 1){
          break
      }

      order_length = order['orders'].length
      console.log(order)
      console.log(order_length)
      console.log(offset)
      for(var o in order['orders']){
        if(event_stop === 1){
            break
          }
        // text.innerHTML = order['orders'][o]['asset']['collection']['slug']
        // text1.innerHTML = ''
        console.log(order['orders'][o]['asset']['collection']['slug'])
        try{
          const collect = await seaport.api.get('/api/v1/collection/' + order['orders'][o]['asset']['collection']['slug'])
          var floor_price = collect['collection']['stats']['floor_price']
          var flooroffer = floor_price * (event_multi - collect['collection']['dev_seller_fee_basis_points']/10000)
        } catch (ex) {
          console.log("couldn't get floor")
          floor_price = 0
          flooroffer = 0
          continue
        } //Object.keys(wallet_set).includes(order['orders'][o]['asset']['collection']['slug']) && 
        if (parseFloat(order['orders'][o].basePrice/1000000000000000000) < flooroffer){
          //console.log('bid: ' + parseFloat(order['orders'][o].basePrice/1000000000000000000))
          //console.log('floor: ' + floor_price)
          var asset = {
            tokenId: order['orders'][o]['asset']['tokenId'],
            tokenAddress: order['orders'][o]['asset']['tokenAddress'],
            //schemaName: WyvernSchemaName.ERC1155
          }
          if (order['orders'][o]['asset']['collection']['slug'] === 'bears-deluxe' || order['orders'][o]['asset']['collection']['slug'] === 'guttercatgang' || order['orders'][o]['asset']['collection']['slug'] === 'clonex-mintvial'){
            asset = {
              tokenId: order['orders'][o]['asset']['tokenId'],
              tokenAddress: order['orders'][o]['asset']['tokenAddress'],
              schemaName: WyvernSchemaName.ERC1155
            }      
          }
          var order_dict = {}
          order_dict['collection'] = order['orders'][o]['asset']['collection']['slug']
          order_dict['asset'] = asset
          order_dict['bid'] = parseFloat(parseFloat(order['orders'][o].basePrice/1000000000000000000) + .001)
          order_dict['floor'] = floor_price
          order_dict['maxbid'] = flooroffer
          order_array.push(order_dict)
        }
      }

    }
    catch(ex) {
      values.default.EVENT = 0
      console.log(ex.message)
      console.log('error with buy orders')
    }
    offset += 50
    } while(order_length === 50)
  }
  if(values.default.API_KEY === values.default.API_KEY2 ){
    values.default.API_KEY = '2f6f419a083c46de9d83ce3dbe7db601'
  }
  
  create_seaport()
  values.default.EVENT = 0
  console.log(order_array.length)
  var order_array_length = order_array.length
  if(values.default.API_KEY !== '2f6f419a083c46de9d83ce3dbe7db601'){
    order_array_length = order_array_length/2
    buy_order_bid(order_array, username)
  } 
  for(var i = 0; i < order_array_length; i++){
    if(event_stop === 1){
      break
    }
    console.log(order_array[i].collection + ' ' + order_array[i].asset.tokenId + ', ' + order_array[i].floor.toFixed(3) + ' max bid: ' + order_array[i].maxbid.toFixed(4)) 

    try{

      await new Promise(resolve => setTimeout(resolve, delay.value))


      await seaport.createBuyOrder({
        asset: order_array[i].asset,
        startAmount: order_array[i].bid,
        accountAddress: values.default.EVENT_WALLET,
        expirationTime: Math.round(Date.now() / 1000 + 60 * 60 * expiration),
      })
      text.innerHTML = order_array[i].collection + ' Floor: ' + order_array[i].floor.toFixed(3) + ' max bid: ' + order_array[i].maxbid.toFixed(4)
      text1.innerHTML = username + ' #' + order_array[i].asset.tokenId + ' upbid: ' + order_array[i].bid.toFixed(4)
      console.log(order_array[i].collection + ' Floor: ' + order_array[i].floor.toFixed(3) + ' max bid: ' + order_array[i].maxbid.toFixed(4))
      console.log(username + ' #' + order_array[i].asset.tokenId + ' upbid: ' + order_array[i].bid.toFixed(4))// + wallet_orders[wallet])
      eventbidcount += 1
      counter += 1 
      offersMade.innerHTML = 'offers made: ' + counter + ' total: ' + order_array.length
    }

    catch(ex){
      console.log(ex)
      console.log(ex.message)
      await new Promise(resolve => setTimeout(resolve, 30000))
    }

  } 
  while(values.default.BID !== 1){
    await new Promise(resolve => setTimeout(resolve, 3000))
    text.innerHTML = 'Waiting...'
    text1.innerHTML = ''
  }
  console.log('offers made: ' + counter)
  text.innerHTML = 'Finding more offers soon...'
  text1.innerHTML = ''
  
  if(event_stop === 1) {
    pause()
    text.innerHTML = ''
    text1.innerHTML = ''
    return 0
  }
  
  if(eventbidcount > 1000){
    if(values.default.ALCHEMY_KEY === undefined){
      create_seaport()
    }
    
  }
  var end_time = Math.floor(+new Date() / 1000)
  if (end_time - start_time < event_window/1000){
    await new Promise(resolve => setTimeout(resolve, (event_window/1000 - (end_time - start_time)) * 1000))
  }
  pause()
  if(event_stop === 0){
    buy_order()
  } 
  
}
async function buy_order_bid(order_array, username){
    for(var i = Math.floor(order_array.length/2); i < order_array.length; i++){
      if(event_stop === 1){
        break
      }
      console.log(order_array[i].collection + ' ' + order_array[i].asset.tokenId + ', ' + order_array[i].floor.toFixed(3) + ' max bid: ' + order_array[i].maxbid.toFixed(4))
      await new Promise(resolve => setTimeout(resolve, delay.value))
      try{
        await seaport.createBuyOrder({
          asset: order_array[i].asset,
          startAmount: order_array[i].bid,
          accountAddress: values.default.EVENT_WALLET,
          expirationTime: Math.round(Date.now() / 1000 + 60 * 60 * expiration),
        })
        text.innerHTML = order_array[i].collection + ' Floor: ' + order_array[i].floor.toFixed(3) + ' max bid: ' + order_array[i].maxbid.toFixed(4)
        text1.innerHTML = username + ' #' + order_array[i].asset.tokenId + ' upbid: ' + order_array[i].bid.toFixed(4)
        console.log(order_array[i].collection + ' Floor: ' + order_array[i].floor.toFixed(3) + ' max bid: ' + order_array[i].maxbid.toFixed(4))
        console.log(username + ' #' + order_array[i].asset.tokenId + ' upbid: ' + order_array[i].bid.toFixed(4))// + wallet_orders[wallet])
        eventbidcount += 1
        counter += 1 
        offersMade.innerHTML = 'offers made: ' + counter + ' total: ' + order_array.length
      }

      catch(ex){
        console.log(ex)
        console.log(ex.message)
        await new Promise(resolve => setTimeout(resolve, 30000))
      }
    }
    values.default.BID = 1
}
document.getElementById('private_sales').addEventListener('click', function(){
  privateSale()
})
async function privateSale(){
  reset()
  start()
  var offset = 0
  let search_time = Math.floor(+new Date()) - 900000
  let search_time2 = Math.floor(+new Date()) 
  search_time = new Date(search_time).toISOString();
  search_time2 = new Date(search_time2).toISOString();
  do{
    await new Promise(resolve => setTimeout(resolve, 500))
    var order_length = 0
    try{   
      const order = await seaport.api.getOrders({
        side: 1,
        order_by: 'created_date',
        listed_after: search_time,
        listed_before: search_time2,
        limit: 50,
        offset: offset
    })
    text.innerHTML = "Pulling event history..."
    var username = 'Null'
    if(order['orders'].length === 0){
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    order_length = order['orders'].length
    for(var o in order['orders']){
      if(order['orders'][o].taker !== '0x0000000000000000000000000000000000000000' && order['orders'][0].makerAccount.user.username.includes('DustBunny')){
          console.log('Private sale found.')
          try{
            console.log(order['orders'][0].makerAccount.user.username)
          } catch(e){
            if(e.message.includes('Cannot read properties')){

            } else{
              console.log(e)
            }
          }
          console.log(order.orders[o])
          console.log(order['orders'][o].basePrice/1000000000000000000)
      }
    }
  }
  catch(ex) {
    if(ex.message.includes('Cannot read properties')){

    } else{
      console.log(ex)
    }
  }
  offset += 50
  console.log(offset)
  } while(order_length === 50)
  console.log('Complete ' + (parseInt(offset) + parseInt(order_length) - 50))
  pause()
}

async function placeBid(){ 
  console.log('Number to upbid: ' + Object.keys(eventDict).length)
  progressBar.value = 0
  progressBar.max = Object.keys(eventDict).length
  progressBar.hidden = false

  for(var key in Object.keys(eventDict)){
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
      //document.getElementById('eventText').innerHTML = key + '/' + Object.keys(eventDict).length + ' Bid: ' + eventDict[Object.keys(eventDict)[key]].toFixed(4) + ' on ' + Object.keys(eventDict)[key]
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
var provider = ''
if(values.default.ALCHEMY_KEY !== undefined){
  provider = 'https://eth-mainnet.alchemyapi.io/v2/' + values.default.ALCHEMY_KEY
} else {
  provider = new Web3.providers.HttpProvider('https://mainnet.infura.io/v3/' + INFURA_KEY)
}
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
  console.log((total_eth/1000000000000000000).toFixed(4))
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
  getBalance(values.default.OWNER_ADDRESS[1].address).then(function (result) {
  document.getElementById('balance').innerHTML = (result/1000000000000000000).toFixed(4)
  });

  getBalance(values.default.OWNER_ADDRESS[0].address).then(function (result) {
      document.getElementById('balance2').innerHTML = (result/1000000000000000000).toFixed(4)
  });
  eth.getBalance(values.default.OWNER_ADDRESS[1].address)
  .then(res => document.getElementById('balance').innerHTML += ' ETH:' + (res/1000000000000000000).toFixed(4));
  eth.getBalance(values.default.OWNER_ADDRESS[0].address)
  .then(res => document.getElementById('balance2').innerHTML += ' ETH:' + (res/1000000000000000000).toFixed(4));
  eth.getBalance(values.default.OWNER_ADDRESS[1].address)
  .then(res => document.getElementById('balancebottom').innerHTML += ' ETH:' + (res/1000000000000000000).toFixed(4));
}

getBalance(values.default.OWNER_ADDRESS[1].address).then(function (result) {
    document.getElementById('balance').innerHTML = (result/1000000000000000000).toFixed(4)

});
getBalance(values.default.OWNER_ADDRESS[1].address).then(function (result) {
    document.getElementById('balancebottom').innerHTML = (result/1000000000000000000).toFixed(4)

});
getBalance(values.default.OWNER_ADDRESS[0].address).then(function (result) {
    document.getElementById('balance2').innerHTML = (result/1000000000000000000).toFixed(4)
});
var accountIndex = 0
document.getElementById('nextAccount-2').addEventListener('click', function(){
  accountIndex += 1
  if(accountIndex === values.default.OWNER_ADDRESS.length){
    accountIndex = 0
  }
  values.default.EVENT_USER = values.default.OWNER_ADDRESS[accountIndex].username
  myAccount2.innerHTML = values.default.OWNER_ADDRESS[accountIndex].username
  getBalance(values.default.OWNER_ADDRESS[accountIndex].address).then(function (result) {
    document.getElementById('balance2').innerHTML = (result/1000000000000000000).toFixed(4)
  });
})
var accountIndex1 = 1
document.getElementById('nextAccount-1').addEventListener('click', function(){
  console.log('nft-nm')
  accountIndex1 += 1
  if(accountIndex1 === values.default.OWNER_ADDRESS.length){
    accountIndex1 = 0
  }
  OWNER_ADDRESS = values.default.OWNER_ADDRESS[accountIndex1].address
  myAccount.innerHTML = values.default.OWNER_ADDRESS[accountIndex1].username
  getBalance(values.default.OWNER_ADDRESS[accountIndex1].address).then(function (result) {
    document.getElementById('balance').innerHTML = (result/1000000000000000000).toFixed(4)
  });
})
// eth.getBalance(values.default.OWNER_ADDRESS[1].address)
// .then(res => document.getElementById('balance').innerHTML += ' ETH:' + (res/1000000000000000000).toFixed(4));
// eth.getBalance(values.default.OWNER_ADDRESS[0].address)
// .then(res => document.getElementById('balance2').innerHTML += ' ETH:' + (res/1000000000000000000).toFixed(4));

var total_weth = 0
var total_eth = 0
if(values.default.TITLE ==='Home'){
  console.log('Account balances (WETH)...')
  //getBalance for weth, eth.getBalance for eth
getBalance('0xB1CbED4ab864e9215206cc88C5F758fda4E01E25').then(function (result) {
    if(parseFloat(result/1000000000000000000) > parseFloat(0.011)){
      console.log('DustBunny: ' + (result/1000000000000000000).toFixed(4))
    }
    eth.getBalance('0xB1CbED4ab864e9215206cc88C5F758fda4E01E25').then(res => total_eth += parseInt(res))
    total_weth += parseInt(result)
});
getBalance('0x35C25Ff925A61399a3B69e8C95C9487A1d82E7DF').then(function (result) {
    if(parseFloat(result/1000000000000000000) > parseFloat(0.011)){
      console.log('DustBunny_22: ' + (result/1000000000000000000).toFixed(4))
    }    
    eth.getBalance('0x35C25Ff925A61399a3B69e8C95C9487A1d82E7DF').then(res => total_eth += parseInt(res))
    total_weth += parseInt(result)
});
getBalance('0x1AEc9C6912D7Da7a35803f362db5ad38207D4b4A').then(function (result) {
    if(parseFloat(result/1000000000000000000) > parseFloat(0.011)){
      console.log('DustBunny_21: ' + (result/1000000000000000000).toFixed(4))
    }    
    eth.getBalance('0x1AEc9C6912D7Da7a35803f362db5ad38207D4b4A').then(res => total_eth += parseInt(res))
    total_weth += parseInt(result)
});
getBalance('0x18a73AaEe970AF9A797D944A7B982502E1e71556').then(function (result) {
    if(parseFloat(result/1000000000000000000) > parseFloat(0.011)){
      console.log('DustBunny_20: ' + (result/1000000000000000000).toFixed(4))
    }
    eth.getBalance('0x18a73AaEe970AF9A797D944A7B982502E1e71556').then(res => total_eth += parseInt(res))
    total_weth += parseInt(result)
});
getBalance('0x4d64bDb86C7B50D8B2935ab399511bA9433A3628').then(function (result) {
    if(parseFloat(result/1000000000000000000) > parseFloat(0.011)){
      console.log('DustBunny_19: ' + (result/1000000000000000000).toFixed(4))
    }
    eth.getBalance('0x4d64bDb86C7B50D8B2935ab399511bA9433A3628').then(res => total_eth += parseInt(res))
    total_weth += parseInt(result)
});
getBalance('0x763be576919a0d32b9e7ebDaF5a858195E04A6Cb').then(function (result) {
    if(parseFloat(result/1000000000000000000) > parseFloat(0.011)){
      console.log('DustBunny_18: ' + (result/1000000000000000000).toFixed(4))
    }
    eth.getBalance('0x763be576919a0d32b9e7ebDaF5a858195E04A6Cb').then(res => total_eth += parseInt(res))
    total_weth += parseInt(result)
});
getBalance('0xd517e2ACDFBBb19BcC3c7069dDDeE2D67Eab4E6c').then(function (result) {
    if(parseFloat(result/1000000000000000000) > parseFloat(0.011)){
      console.log('DustBunny_17: ' + (result/1000000000000000000).toFixed(4))
    }
    eth.getBalance('0xd517e2ACDFBBb19BcC3c7069dDDeE2D67Eab4E6c').then(res => total_eth += parseInt(res))
    total_weth += parseInt(result)
});
getBalance('0x8F2D0aFD7a8e444f7e905DE5F09E04e6c382362e').then(function (result) {
    if(parseFloat(result/1000000000000000000) > parseFloat(0.011)){
      console.log('DustBunny_16: ' + (result/1000000000000000000).toFixed(4))
    }
    eth.getBalance('0x8F2D0aFD7a8e444f7e905DE5F09E04e6c382362e').then(res => total_eth += parseInt(res))
    total_weth += parseInt(result)
});
getBalance('0x036910a9621218447C95805C2dCBc9B3bD1D39d4').then(function (result) {
    if(parseFloat(result/1000000000000000000) > parseFloat(0.011)){
      console.log('DustBunny_15: ' + (result/1000000000000000000).toFixed(4))
    }
    eth.getBalance('0x036910a9621218447C95805C2dCBc9B3bD1D39d4').then(res => total_eth += parseInt(res))
    total_weth += parseInt(result)
});
getBalance('0xb56851362dE0f360E91e5F52eC64d0A1D52E98E6').then(function (result) {
    if(parseFloat(result/1000000000000000000) > parseFloat(0.011)){
      console.log('DustBunny_1: ' + (result/1000000000000000000).toFixed(4))
    }
    eth.getBalance('0xb56851362dE0f360E91e5F52eC64d0A1D52E98E6').then(res => total_eth += parseInt(res))
    total_weth += parseInt(result)
});
getBalance('0x52d809BCd3c631760b1e480b8D3bE13D7eEC0E25').then(function (result) {
    if(parseFloat(result/1000000000000000000) > parseFloat(0.011)){
      console.log('DustBunny_2: ' + (result/1000000000000000000).toFixed(4))
    }
    eth.getBalance('0x52d809BCd3c631760b1e480b8D3bE13D7eEC0E25').then(res => total_eth += parseInt(res))
    total_weth += parseInt(result)
});
getBalance('0xfb27e7b963982fb3a955c401f93a0db8042e679e').then(function (result) {
    if(parseFloat(result/1000000000000000000) > parseFloat(0.011)){
      console.log('DustBunny_3: ' + (result/1000000000000000000).toFixed(4))
    }
    eth.getBalance('0xfb27e7b963982fb3a955c401f93a0db8042e679e').then(res => total_eth += parseInt(res))
    total_weth += parseInt(result)
});
getBalance('0xE143d6306C1743280D40e968F48cae36F56fC7d1').then(function (result) {
    if(parseFloat(result/1000000000000000000) > parseFloat(0.011)){
      console.log('DustBunny_4: ' + (result/1000000000000000000).toFixed(4))
    }
    eth.getBalance('0xE143d6306C1743280D40e968F48cae36F56fC7d1').then(res => total_eth += parseInt(res))
    total_weth += parseInt(result)
});
getBalance('0xfCe9DC535364DcBd10e1D8f2F996761ec5eD03aC').then(function (result) {
    if(parseFloat(result/1000000000000000000) > parseFloat(0.011)){
      console.log('DustBunny_5: ' + (result/1000000000000000000).toFixed(4))
    }
    eth.getBalance('0xfCe9DC535364DcBd10e1D8f2F996761ec5eD03aC').then(res => total_eth += parseInt(res))
    total_weth += parseInt(result)
});
getBalance('0xFB666Bb0Ee1D073a9006865D961AA3C3611685a9').then(function (result) {
    if(parseFloat(result/1000000000000000000) > parseFloat(0.011)){
      console.log('DustBunny_6: ' + (result/1000000000000000000).toFixed(4))
    }
    eth.getBalance('0xFB666Bb0Ee1D073a9006865D961AA3C3611685a9').then(res => total_eth += parseInt(res))
    total_weth += parseInt(result)
});
getBalance('0x5ea09d2E44759C46F8F2a884815B6bD06dcA440F').then(function (result) {
    if(parseFloat(result/1000000000000000000) > parseFloat(0.011)){
      console.log('DustBunny_7: ' + (result/1000000000000000000).toFixed(4))
    }
    eth.getBalance('0x5ea09d2E44759C46F8F2a884815B6bD06dcA440F').then(res => total_eth += parseInt(res))
    total_weth += parseInt(result)
});
getBalance('0x73B2d479691Ea1d932D047149F158AD51249D660').then(function (result) {
    if(parseFloat(result/1000000000000000000) > parseFloat(0.011)){
      console.log('DustBunny_8: ' + (result/1000000000000000000).toFixed(4))
    }
    eth.getBalance('0x73B2d479691Ea1d932D047149F158AD51249D660').then(res => total_eth += parseInt(res))
    total_weth += parseInt(result)
});
getBalance('0xC4cF8D37a72463722FDE94A6ac1867E3C482A85c').then(function (result) {
    if(parseFloat(result/1000000000000000000) > parseFloat(0.011)){
      console.log('DustBunny_9: ' + (result/1000000000000000000).toFixed(4))
    }
    eth.getBalance('0xC4cF8D37a72463722FDE94A6ac1867E3C482A85c').then(res => total_eth += parseInt(res))
    total_weth += parseInt(result)
});
getBalance('0xA6E3Dd05cd995C3D7f4E84917B5292b4D2de4c3E').then(function (result) {
    if(parseFloat(result/1000000000000000000) > parseFloat(0.011)){
      console.log('DustBunny_10: ' + (result/1000000000000000000).toFixed(4))
    }
    eth.getBalance('0xA6E3Dd05cd995C3D7f4E84917B5292b4D2de4c3E').then(res => total_eth += parseInt(res))
    total_weth += parseInt(result)
});
getBalance('0xc966380FC69D989E7fA021d2F6F0e3db65F36f59').then(function (result) {
    if(parseFloat(result/1000000000000000000) > parseFloat(0.011)){
      console.log('DustBunny_11: ' + (result/1000000000000000000).toFixed(4))
    }
    eth.getBalance('0xc966380FC69D989E7fA021d2F6F0e3db65F36f59').then(res => total_eth += parseInt(res))
    total_weth += parseInt(result)
});
getBalance('0x8B3466FFf6F40a366deD61458BCF7EEF043d325c').then(function (result) {
    if(parseFloat(result/1000000000000000000) > parseFloat(0.011)){
      console.log('DustBunny_12: ' + (result/1000000000000000000).toFixed(4))
    }
    eth.getBalance('0x8B3466FFf6F40a366deD61458BCF7EEF043d325c').then(res => total_eth += parseInt(res))
    total_weth += parseInt(result)
});
getBalance('0x4cc553e8bbbA85DeDe46b997455d23034F70bb32').then(function (result) {
    if(parseFloat(result/1000000000000000000) > parseFloat(0.011)){
      console.log('DustBunny_13: ' + (result/1000000000000000000).toFixed(4))
    }
    eth.getBalance('0x4cc553e8bbbA85DeDe46b997455d23034F70bb32').then(res => total_eth += parseInt(res))
    total_weth += parseInt(result)
});
getBalance('0x562b209A296E86560a3185dBD5E03Bc095eBc94D').then(function (result) {
    if(parseFloat(result/1000000000000000000) > parseFloat(0.011)){
      console.log('DustBunny_14: ' + (result/1000000000000000000).toFixed(4))
    }
    eth.getBalance('0x562b209A296E86560a3185dBD5E03Bc095eBc94D').then(res => total_eth += parseInt(res))
    total_weth += parseInt(result)
});
getBalance('0x67707b8E56b843099d5eF656Bc840D46d1c0e6d4').then(function (result) {
    if(parseFloat(result/1000000000000000000) > parseFloat(0.011)){
      console.log('DustBunny_23: ' + (result/1000000000000000000).toFixed(4))
    }
    eth.getBalance('0x67707b8E56b843099d5eF656Bc840D46d1c0e6d4').then(res => total_eth += parseInt(res))
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

try{
  delay.value = values.default.DEFAULT_DELAY
} catch(ex){
  console.log('No default delay set')
}
if(values.default.API_KEY === '2f6f419a083c46de9d83ce3dbe7db601'){
  delay.value = 3000
}
document.getElementById('addDelay').addEventListener('click', function(){
  delay.value = parseInt(delay.value) + 100
  //document.getElementById('delay').value = offerAmount
})
document.getElementById('minusDelay').addEventListener('click', function(){
  delay.value -= 100
  //document.getElementById('delay').value = offerAmount
})
var traits_count = 0
//
// Grab collection to submit offers on. 
//
document.getElementById('clearTrait').addEventListener('click', function(){
  removeChilds(document.getElementById('traitsDiv'))
  traits_count = 0
  console.log('Cleared traits')
})

const removeChilds = (parent) => {
    while (parent.lastChild) {
        parent.removeChild(parent.lastChild);
    }
};
async function getCollection(collectionName){
  offers = 0
  progressBar.value = 0
  collectionName = collectionName.trim()
  console.log(collectionName)
  var collect = getCollectionDetails(collectionName)
          if(collectionName === 'cool-cats-nfts'){
      
      for(var i in cool_cat_traits.default.traits){
        console.log(cool_cat_traits.default.traits[i])
        var traitDiv = document.getElementById('traitsDiv')
        var property = document.createElement('input')
        var trait = document.createElement('input')
        var traitbid = document.createElement('input')
        property.value = cool_cat_traits.default.traits[i][0]
        trait.value = cool_cat_traits.default.traits[i][1]
        trait.id = 'trait' + traits_count
        trait.style.width = '100px'
        property.id = 'property' + traits_count
        property.style.width = '100px'
        traitbid.id = 'bid' + traits_count
        traitbid.style.width = '40px'

        var br = document.createElement('br')
        traitDiv.appendChild(property)
        traitDiv.appendChild(trait)
        traitDiv.appendChild(traitbid)
        traitDiv.appendChild(br)
        traits_count += 1
      }
    }
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

        document.getElementById('assetCount').value = collect['collection']['stats']['count']
      

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
  clear_collection()
})
function clear_collection(){
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
}
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
    var prop1 = ''
    var trait1 = ''
    var bid1 = 0
    if(Object.keys(offersDict).length > 0){
      prop1 = offersDict[Object.keys(offersDict)[0]][0]
      trait1 = offersDict[Object.keys(offersDict)[0]][1]
      bid1 = offersDict[Object.keys(offersDict)[0]][2]
    }
    if(maxOfferAmount !== 0 && values.default.API_KEY !== '2f6f419a083c46de9d83ce3dbe7db601') {
      delay.value = 250
    }
    await new Promise(resolve => setTimeout(resolve, 3000));
    for(var i = startToken.value; i <= endToken.value; i++){
    if(stop === 1){
      break
    }

    await new Promise(resolve => setTimeout(resolve, delay.value))
    var bidMade = 0
    if(Object.keys(offersDict).length > 0){
          try{
              const asset = await seaport.api.getAsset({
              tokenAddress: NFT_CONTRACT_ADDRESS,
              tokenId: i,
              })
            for(var trait in asset['traits']){
              if (asset['traits'][trait]['trait_type'].toLowerCase().includes(prop1)){
                if(asset['traits'][trait]['value'].toLowerCase().includes(trait1)){
                  try{
                    //console.log(asset['traits'][trait]['value'] + ': ' + offersDict[Object.keys(offersDict)[trait]][2] + " on #" + i)
                    await seaport.createBuyOrder({
                    asset: {
                        tokenId: i,
                        tokenAddress: NFT_CONTRACT_ADDRESS
                    },
                    startAmount: bid1,
                    accountAddress: OWNER_ADDRESS,
                    expirationTime: Math.round(Date.now() / 1000 + 60 * 60 * expirationHours),
                    })
                    await new Promise(resolve => setTimeout(resolve, delay.value))
                    text.style.color = 'black'
                    text.innerHTML = asset['traits'][trait]['value'] + ': ' + bid1 + " on #" + i
                    offers += 1
                    //document.getElementById('offersMade').innerHTML = 'Offers made: ' + offers
                } catch(ex) {
                    var error_message = check_errors(ex.message)
                    text.style.color = 'red'
                    text.innerHTML = 'Error......'
                    text.innerHTML = error_message

                    if(error_message === 0){
                      beep();
                      await new Promise(resolve => setTimeout(resolve, 60000))
                    }
                    else if(error_message === 'Insufficient balance. Please wrap more ETH.')
                    {
                      await new Promise(resolve => setTimeout(resolve, 300000))
                    }
                     else {
                      text.innerHTML = error_message
                    }               
                    console.log('**FAILED**! #' + i)
                }
                offset = 0
                progressBar.value += 1
                offersMade.innerHTML = offers + '/' + progressBar.max
                bidMade = 1
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
        if(offers % 100 === 0){
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
      beep();
      console.log('thread1 done')
      pause()
      document.getElementById('body').style.background = '#D9B3FF'
    }
}
function check_errors(msg){
  if(msg.includes('Insufficient balance.')){
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
  }
  return 0
}

async function main1(){
    text1.style.fontSize = '20px'
    text1.innerHTML = 'Starting.....'
    var offset1 = 0
    var prop1 = ''
    var trait1 = ''
    var bid1 = 0
    if(Object.keys(offersDict).length > 0){
      prop1 = offersDict[Object.keys(offersDict)[0]][0]
      trait1 = offersDict[Object.keys(offersDict)[0]][1]
      bid1 = offersDict[Object.keys(offersDict)[0]][2]
    }
    if(maxOfferAmount !== 0 && values.default.API_KEY !== '2f6f419a083c46de9d83ce3dbe7db601') {
      delay.value = 250
    }
    for(var i = endToken1.value; i >= startToken1.value; i--){
        if(stop2 === 1){
          break
        }
        await new Promise(resolve => setTimeout(resolve, delay.value))
        var bidMade = 0
        if(Object.keys(offersDict).length > 0){
          try{
              const asset = await seaport.api.getAsset({
              tokenAddress: NFT_CONTRACT_ADDRESS,
              tokenId: i,
              })
            for(var trait in asset['traits']){
              if (asset['traits'][trait]['trait_type'].toLowerCase().includes(prop1)){
                if(asset['traits'][trait]['value'].toLowerCase().includes(trait1)){
                  try{
                    //console.log(asset['traits'][trait]['value'] + ': ' + offersDict[Object.keys(offersDict)[trait]][2] + " on #" + i)
                    await seaport.createBuyOrder({
                    asset: {
                        tokenId: i,
                        tokenAddress: NFT_CONTRACT_ADDRESS
                    },
                    startAmount: bid1,
                    accountAddress: OWNER_ADDRESS,
                    expirationTime: Math.round(Date.now() / 1000 + 60 * 60 * expirationHours),
                    })
                    text1.style.color = 'black'
                    text1.innerHTML = asset['traits'][trait]['value'] + ': ' + bid1 + " on #" + i
                    offers += 1
                    //document.getElementById('offersMade').innerHTML = 'Offers made: ' + offers
                } catch(ex) {
                    var error_message = check_errors(ex.message)
                    text1.style.color = 'red'
                    text1.innerHTML = 'Error......'
                    text1.innerHTML = error_message

                    if(error_message === 0){
                      beep();
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
        offersMade.innerHTML = offers + '/' + progressBar.max 

    }
    text1.style.color = 'purple'
    if (startToken1.value === endToken1.value){
      text1.innerHTML = 'COMPLETE'
    }
    thread2done = 1
    if (thread1done + thread2done  === 2){
      beep();
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
  document.getElementById('assetCount').value = ''
  stop = 1
  stop2 = 1
  offers = 0
  progressBar.value = 0
  maxOfferAmount = 0
  offerAmount = 0
  expirationHours = 1
  text.innerHTML = ''
  text1.innerHTML = ''
  increaseBid.disabled = true
  increaseBid1.disabled = true
  quickButton.disabled = true
  startButton.disabled = true
  progressBar.hidden = true
  offersMade.innerHTML = ''
  clear_collection()

})

var offersDict = {}
//OFFER AMOUNT SHOULD ONLY CHANGE HERE EVER
//OFFER AMOUNT SHOULD ONLY CHANGE HERE EVER
//OFFER AMOUNT SHOULD ONLY CHANGE HERE EVER
//OFFER AMOUNT SHOULD ONLY CHANGE HERE EVER
confirmButton.addEventListener('click', function(){
  if (confirmCollection === 1) {
      var traitsDiv = document.getElementById('traitsDiv')
      offersDict = {}
    for (const property in traitsDiv.children) {
      try {
        //console.log(traitsDiv.children[property])
        if(traitsDiv.children[property].id.includes('property')){
          offersDict[traitsDiv.children[property].id] = [traitsDiv.children[parseInt(property)].value, traitsDiv.children[parseInt(property)+1].value,traitsDiv.children[parseInt(property)+2].value]
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
    stop = 0 
    stop2 = 0
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
  console.log(offersDict)
})
function beep() {
    var snd = new Audio("data:audio/wav;base64,//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAGDgYtAgAyN+QWaAAihwMWm4G8QQRDiMcCBcH3Cc+CDv/7xA4Tvh9Rz/y8QADBwMWgQAZG/ILNAARQ4GLTcDeIIIhxGOBAuD7hOfBB3/94gcJ3w+o5/5eIAIAAAVwWgQAVQ2ORaIQwEMAJiDg95G4nQL7mQVWI6GwRcfsZAcsKkJvxgxEjzFUgfHoSQ9Qq7KNwqHwuB13MA4a1q/DmBrHgPcmjiGoh//EwC5nGPEmS4RcfkVKOhJf+WOgoxJclFz3kgn//dBA+ya1GhurNn8zb//9NNutNuhz31f////9vt///z+IdAEAAAK4LQIAKobHItEIYCGAExBwe8jcToF9zIKrEdDYIuP2MgOWFSE34wYiR5iqQPj0JIeoVdlG4VD4XA67mAcNa1fhzA1jwHuTRxDUQ//iYBczjHiTJcIuPyKlHQkv/LHQUYkuSi57yQT//uggfZNajQ3Vmz+Zt//+mm3Wm3Q576v////+32///5/EOgAAADVghQAAAAA//uQZAUAB1WI0PZugAAAAAoQwAAAEk3nRd2qAAAAACiDgAAAAAAABCqEEQRLCgwpBGMlJkIz8jKhGvj4k6jzRnqasNKIeoh5gI7BJaC1A1AoNBjJgbyApVS4IDlZgDU5WUAxEKDNmmALHzZp0Fkz1FMTmGFl1FMEyodIavcCAUHDWrKAIA4aa2oCgILEBupZgHvAhEBcZ6joQBxS76AgccrFlczBvKLC0QI2cBoCFvfTDAo7eoOQInqDPBtvrDEZBNYN5xwNwxQRfw8ZQ5wQVLvO8OYU+mHvFLlDh05Mdg7BT6YrRPpCBznMB2r//xKJjyyOh+cImr2/4doscwD6neZjuZR4AgAABYAAAABy1xcdQtxYBYYZdifkUDgzzXaXn98Z0oi9ILU5mBjFANmRwlVJ3/6jYDAmxaiDG3/6xjQQCCKkRb/6kg/wW+kSJ5//rLobkLSiKmqP/0ikJuDaSaSf/6JiLYLEYnW/+kXg1WRVJL/9EmQ1YZIsv/6Qzwy5qk7/+tEU0nkls3/zIUMPKNX/6yZLf+kFgAfgGyLFAUwY//uQZAUABcd5UiNPVXAAAApAAAAAE0VZQKw9ISAAACgAAAAAVQIygIElVrFkBS+Jhi+EAuu+lKAkYUEIsmEAEoMeDmCETMvfSHTGkF5RWH7kz/ESHWPAq/kcCRhqBtMdokPdM7vil7RG98A2sc7zO6ZvTdM7pmOUAZTnJW+NXxqmd41dqJ6mLTXxrPpnV8avaIf5SvL7pndPvPpndJR9Kuu8fePvuiuhorgWjp7Mf/PRjxcFCPDkW31srioCExivv9lcwKEaHsf/7ow2Fl1T/9RkXgEhYElAoCLFtMArxwivDJJ+bR1HTKJdlEoTELCIqgEwVGSQ+hIm0NbK8WXcTEI0UPoa2NbG4y2K00JEWbZavJXkYaqo9CRHS55FcZTjKEk3NKoCYUnSQ0rWxrZbFKbKIhOKPZe1cJKzZSaQrIyULHDZmV5K4xySsDRKWOruanGtjLJXFEmwaIbDLX0hIPBUQPVFVkQkDoUNfSoDgQGKPekoxeGzA4DUvnn4bxzcZrtJyipKfPNy5w+9lnXwgqsiyHNeSVpemw4bWb9psYeq//uQZBoABQt4yMVxYAIAAAkQoAAAHvYpL5m6AAgAACXDAAAAD59jblTirQe9upFsmZbpMudy7Lz1X1DYsxOOSWpfPqNX2WqktK0DMvuGwlbNj44TleLPQ+Gsfb+GOWOKJoIrWb3cIMeeON6lz2umTqMXV8Mj30yWPpjoSa9ujK8SyeJP5y5mOW1D6hvLepeveEAEDo0mgCRClOEgANv3B9a6fikgUSu/DmAMATrGx7nng5p5iimPNZsfQLYB2sDLIkzRKZOHGAaUyDcpFBSLG9MCQALgAIgQs2YunOszLSAyQYPVC2YdGGeHD2dTdJk1pAHGAWDjnkcLKFymS3RQZTInzySoBwMG0QueC3gMsCEYxUqlrcxK6k1LQQcsmyYeQPdC2YfuGPASCBkcVMQQqpVJshui1tkXQJQV0OXGAZMXSOEEBRirXbVRQW7ugq7IM7rPWSZyDlM3IuNEkxzCOJ0ny2ThNkyRai1b6ev//3dzNGzNb//4uAvHT5sURcZCFcuKLhOFs8mLAAEAt4UWAAIABAAAAAB4qbHo0tIjVkUU//uQZAwABfSFz3ZqQAAAAAngwAAAE1HjMp2qAAAAACZDgAAAD5UkTE1UgZEUExqYynN1qZvqIOREEFmBcJQkwdxiFtw0qEOkGYfRDifBui9MQg4QAHAqWtAWHoCxu1Yf4VfWLPIM2mHDFsbQEVGwyqQoQcwnfHeIkNt9YnkiaS1oizycqJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");  
    snd.play();
}

///////////////////////////////////////////////
var favorites = document.getElementById('favorites')
var favorite_array = values.default.FAVORITES

getCollectionDetails_fav()
async function getCollectionDetails(collectionName){
  try{
    const collect = await seaport.api.get('/api/v1/collection/' + collectionName)
    return collect
  } catch (ex) {
    console.log("couldn't get collection")
  }  
}
async function getCollectionDetails_fav(){
  for(var key in favorite_array){
  const fav = favorite_array[key]
    try{  
    const collect = await seaport.api.get('/api/v1/collection/' + fav)
    //var totalAssets = favorite_dict[fav][0]
    var nodep = document.createElement('p')
    nodep.style = 'text-align: center; font-size: 14px'
    //window.open('https://opensea.io/collection/' + COLLECTION_NAME,'name','width=this.width,height=this.height')
    //console.log(collect)
    //nodep.innerHTML = fav + '<br>' + totalAssets + '<br>'
    nodep.addEventListener('click', function(){
      if (progressBar.value === 0){
        //getCollection(fav)
        //collectionInput.value = fav
        document.getElementById('collectionInput-2').value = fav
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
    nodep.innerHTML = fav + ' ' + current_floor.toFixed(2) + '<br>' + collect['collection']['stats']['count'] + ' ' + (collect['collection']['dev_seller_fee_basis_points'] / 100) + '%<br>'
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

  } catch (ex) {
    console.log("couldn't get collections")
  }  

  
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
  // DEFAULT_SET: 'doodles-official',
  // DEFAULT_TRAIT: ['',''],
  // DEFAULT_DELAY: 50,
  // WALLET_SETS: {
  //   'cool-cats-nft': '0x13b451d77b87361d376ae211f640ed1a4491181d',
  //   // 'doodles-official': '0x4beac303c8fdf1f3cd34509b344067e86dcbc506',
  //   // 'bears-deluxe': '0x41899a097dac875318bf731e5f4a972544ad002d',
  //   // 'anonymice': '0x4beac303c8fdf1f3cd34509b344067e86dcbc506',
  //   // 'creatureworld': '0x41899a097dac875318bf731e5f4a972544ad002d',
  //   // 'cryptoadz-by-gremplin': '0x0a85b0be9574a86b526e1f99cc6a3f2ad30baa65',
  //   // 'world-of-women-nft':'0x41899a097dac875318bf731e5f4a972544ad002d',
  //   // // 'loot': '0x60bf609e0e8b724dc61ffee24737af15a6f6d905',
  //   // 'cyberkongz': '0x4beac303c8fdf1f3cd34509b344067e86dcbc506',
  //   // 'metahero-generative': '0x4beac303c8fdf1f3cd34509b344067e86dcbc506',
  // },
  // FAVORITES: ['doodles-official', 'cryptoadz-by-gremplin', 'cyberkongz'],


    // { //kongz, metaheroes 
    //   username: 'BalloonAnimal',
    //   address: '0x4beac303c8fdf1f3cd34509b344067e86dcbc506'
    // },
    // { //doodles
    //   username: 'Sad002d',
    //   address: '0x41899a097dac875318bf731e5f4a972544ad002d'
    // },
    // { //cats
    //   username: 'DustBunny',
    //   address: '0x13b451d77b87361d376ae211f640ed1a4491181d'
    // },
    // { //toadz
    //   username: 'cakebatter',
    //   address: '0x0a85b0be9574a86b526e1f99cc6a3f2ad30baa65'
    // },
    // { //loot, mice
    //   username: 'doughnuthole',
    //   address: '0x60bf609e0e8b724dc61ffee24737af15a6f6d905'
    // },
    // { //cats
    //   username: 'DE2E017',
    //   address: '0x774a4a3c3130e4850a84dc8c80945dee4de2e017'
    // },
    // { //creatures, women
    //   username: 'T74b93017',
    //   address: '0x1484d9ae6d590d6b0981e802f555a8dd74b93017'
    // },
    // { //creatures, women
    //   username: 'T801703',
    //   address: '0x873da8e14fd648b763fe896caa41935e17801703'
    // },
    // { //bears
    //   username: 'nftd00d',
    //   address: '0xd76654102c5f3c27886d5b3ec47b3111e18d8126'
    // },
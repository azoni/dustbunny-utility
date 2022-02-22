const fs = require('fs')
const data_node = require('./data_node.js')
// const secret = require('./secret_node.js')
const opensea = require("opensea-js")
const Network = opensea.Network;
const RPCSubprovider = require("web3-provider-engine/subproviders/rpc");
const Web3ProviderEngine = require("web3-provider-engine");
const OpenSeaPort = opensea.OpenSeaPort;
const node_redis = require('redis')
const http = require('http')

// const MnemonicWalletSubprovider = require("@0x/subproviders")
// .MnemonicWalletSubprovider;
// const MNEMONIC = secret.MNEMONIC2
// const mnemonicWalletSubprovider = new MnemonicWalletSubprovider({
//   mnemonic: MNEMONIC,
// });
// var INFURA_KEY = 'deb8c4096c784171b97a21f7a5b7ba98'
// provider_string = "https://mainnet.infura.io/v3/" + INFURA_KEY
// var infuraRpcSubprovider = new RPCSubprovider({
// 	rpcUrl: provider_string//"https://mainnet.infura.io/v3/" + INFURA_KEY
//   });
var providerEngine = new Web3ProviderEngine();
// providerEngine.addProvider(mnemonicWalletSubprovider);
// providerEngine.addProvider(infuraRpcSubprovider);

var seaport = new OpenSeaPort(
  providerEngine,
  {
    networkName: Network.Main,
    apiKey: '9e72715b3e504813ac3ebc0512d473bf'
  },
  (arg) => console.log(arg)
);

providerEngine.start()
// function get_traits_floor(traits){
// 	for(asset in assets){
// 		if(asset){

// 		}
// 	}
// }

async function get_listed_asset(slug){
	var listed_assets = []
	var assets = await get_assets(slug)
	for(let asset of assets){
		if(asset.sellOrders !== null){
			listed_assets.push(asset)
		}
	}
	return listed_assets
}

async function get_collection(slug){
	try{
		const collect = await seaport.api.get('/api/v1/collection/' + slug)
		return collect
	} catch (ex) {
		console.log("couldn't get floor")
	} 
}
async function get_assets(slug){
	// if slug exists call from json
	// else opensea api call
	var offset = 0
	var limit = 50
	var assets_length = 0
	var assets_dict = {}
	var assets_list = []
	try {
		return require('./collections/' + slug + '.json').assets
	} catch(ex) {
		do {
			var assets = await seaport.api.getAssets({
				'collection': slug,
				'offset': offset,
				'limit': limit,
			})
			assets.assets.forEach((asset) =>{
				assets_list.push(asset)
			})
			assets_length = assets.assets.length
			offset += 50
			if(offset % 1000 === 0){
				console.log(offset)
			}
			
		} while(assets_length === 50)
	
		return assets_list
	}

}

// 
async function write_assets(slug, total_assets){
	// if slug exists call from json
	// else opensea api call
	var path = './collections/' + slug + '.json'
	var offset = 0
	var limit = 50
	var assets_length = 0
	var assets_dict = {}
	var assets_list = []
	var direction = 'asc'
	var temp_offset = 0
	var invalid = 0
	do {
		var assets = await seaport.api.getAssets({
			'collection': slug,
			'offset': offset,
			'limit': limit,
			'order_direction': direction
		})
		//Check for null. Ex. colection 10,000 assets, storing 10,050
		assets.assets.forEach((asset) =>{
			var trimmed_asset = {}
			trimmed_asset['tokenId'] = asset['tokenId']
			trimmed_asset['traits'] = asset['traits']
			trimmed_asset['name'] = asset['name']
			trimmed_asset['tokenAddress'] = asset['tokenAddress']
			trimmed_asset['imageUrl'] = asset['imageUrl']
			if(asset['imageUrl'] !== ''){
				assets_list.push(trimmed_asset)
			} else {
				console.log("Asset doesn't exist")
				invalid += 1
			}
			
		})
		assets_length = assets.assets.length
		//console.log(assets_list)
		offset += 50
		if(offset === 10000){
			temp_offset = 10000
			offset = 0
			direction = 'desc'
		}
		if(total_assets - temp_offset - offset < 50){
			limit = total_assets - offset - temp_offset
		}
		console.log(assets_list.length)
	} while(assets_list.length < total_assets - invalid)

	assets_dict['assets'] = assets_list
	console.log(assets_dict['assets'][total_assets - invalid - 1])
	const data = JSON.stringify(assets_dict);

	fs.writeFile(path, data, (err) => {
	    if (err) {
	        throw err;
	    }
	    console.log("JSON data is saved.");
	});
}

async function read_assets(slug){
	var path = './collections/' + slug + '.json'
	var asset_data = fs.readFileSync(path, "utf8")
	asset_data = JSON.parse(asset_data.toString())
	// console.log(asset_data)
	// console.log(asset_data.assets.length)
	return asset_data
}

//Asset object, BidAmount, Expiration
async function bid_asset_list(){

}
//TokenId, TokenAddress, BidAmount, Expiration
async function bid_single_collection(){

}
//dev_seller_fee_basis_points
//image_url
//stats
async function getCollectionDetails(collectionName){
  try{
    const collect = await seaport.api.get('/api/v1/collection/' + collectionName)
	temp_collect = {}

	temp_collect[''] = collect['']


    return collect
  } catch (ex) {
    console.log("couldn't get collection")
  }  
}
//order['orders'][o].taker !== '0x0000000000000000000000000000000000000000'
async function buy_order_by_collection(){
	try{   
		const order = await seaport.api.getOrders({
			side: 1,
			order_by: 'created_date',
			listed_after: search_time,
			listed_before: search_time2,
			limit: 50,
			offset: offset
		})
	} catch(ex){
		console.log(ex.message)
	}
}

async function fulfil_order(){
	var asset = await seaport.api.getAsset({
		'tokenAddress': '0x9508f760833b82cdfc030d66aa278c296e013f57',
		'tokenId': 1381,
	})
	let sell_order = asset.sellOrders[0]

	try{
		const transactionHash = await seaport.fulfillOrder({order: sell_order, 
			accountAddress:'0xcAe462347cd2d83f9A548AFAcb2CA6E0C6063BfF'})
		console.log(transactionHash)
	} catch(ex){
		console.log('catch')
		console.log(ex)
	}
}
async function sleep(ms){
	await new Promise(resolve => setTimeout(resolve, ms))
}
function get_ISOString(seconds){
	let search_time = Math.floor(+new Date()) - seconds
	return new Date(search_time).toISOString();
}
function get_ISOString_now(){
	let search_time = Math.floor(+new Date())
	return new Date(search_time).toISOString();
}

var wallet_set = data_node.WATCH_LIST
var wallet_orders = data_node.COMP_WALLETS
var event_window = 60000
async function get_competitor_bids(){
	var start_time = Math.floor(+new Date())
  // if(document.getElementById('event_window').value !== ''){
  //   event_window = document.getElementById('event_window').value * 1000
  // } 
  // var start_time = Math.floor(+new Date() / 1000)
  // if(document.getElementById('event_wallet').value !== ''){
  //   wallet_orders = [document.getElementById('event_wallet').value]
  // }
  // if(document.getElementById('event_collection').value !== ''){
  //   var collect_set = document.getElementById('event_collection').value
  //   wallet_set = [collect_set]
  // }

  // reset()
  // start()

  let search_time = get_ISOString(event_window)
  let search_time2 = get_ISOString_now()

  console.log(search_time)
  var counter = 0

  for(var wallet in wallet_orders){
  	await sleep(500)
    var offset = 0
    do{
    	await sleep(250)
	    try{
		    const order = await seaport.api.getOrders({
		      side: 0,
		      order_by: 'created_date',
		      maker: wallet_orders[wallet],
		      listed_after: search_time,
		      listed_before: search_time2,
		      limit: 50,
		      offset: offset
		    })
		    try{
	        var username = order['orders'][0].makerAccount.user.username
	        console.log(username)
	      } catch(ex){
	        username = 'Null'
	      }
	      // console.log(order.orders)
		    var order_length = order['orders'].length
		    redis_push_bids(order)
	    }
	    catch(ex) {
	      console.log(ex.message)
	      console.log('error with buy orders')
	    }
	    counter += order_length
	    offset += 50
    } while(order_length === 50)
    console.log(counter)
  }
  // console.log(start_time)
  var end_time = Math.floor(+new Date())
  // console.log(end_time)
  // console.log(end_time - start_time)
  // console.log(end_time - start_time < event_window)
  console.log(await client.LLEN("queue:flash"))
  if (end_time - start_time < event_window){
  	console.log('waiting: ' + (end_time - start_time))
  	await sleep((end_time - start_time))
  }
  // get_competitor_bids()
}
// get_competitor_bids()
const client = node_redis.createClient({
	url: "redis://10.0.0.77:6379",
});
client.connect();
client.on('error', (err) => console.log('Redis Client Error', err));

async function redis_push_asset(asset){
	await client.rPush('queue:flash', JSON.stringify(asset));
}

const requestListener = function(req, res){
	    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Request-Method', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
    res.setHeader('Access-Control-Allow-Headers', '*');
    if ( req.method === 'OPTIONS' ) {
        res.writeHead(200);
        res.end();
        return;
    }
	res.writeHead(200)
	console.log(req.url)
	if(req.url === '/test_call'){
		
		test_call().then(val => {
			res.write('[');
			let first = true;
			for (const el of val) {
				if (!first) {
					res.write(',');
				} else {
					first = false;
				}
				res.write(el);
				
			}
			res.end(']');
		});
	} else {
		res.end('bye you');
	}
}
//172
const server = http.createServer(requestListener)
server.listen(3000, '10.0.0.172', () => {
	console.log('Server is running')
})

async function dump_queue(){
	client.DEL('queue:flash')
	console.log(await client.LLEN("queue:flash"))
}
//http method - client pull
async function test_call(){
	return await client.lPopCount('queue:flash', 3)
}
//http method - client push
async function node_redis_push(payload){
	await client.rPush('queue:flash', JSON.stringify(order));
}

// get_competitor_bids()
// async function test(){
// 	const client = node_redis.createClient({
//   	url: "redis://10.0.0.77:6379",
// 	});
// 	client.on('error', (err) => console.log('Redis Client Error', err));

//   await client.connect();
  
//   await client.rPush('queue:flash', JSON.stringify({'test':'hello'}));
//   const value = await client.lPop('queue:flash');
//   console.log(value)

// }
// test()
async function main(){
	var slug = ['chain-runners-nft']
	// var assets = await get_assets('cool-cats-nft')
	// console.log(assets)
	for(var index in slug){
		var collect = await getCollectionDetails(slug[index])
		await write_assets(slug[index], collect.collection.stats.total_supply)
	}
	// var collect = await getCollectionDetails('alienfrensnft')
	// console.log(collect.collection.stats.count)
	// console.log(collect.collection.traits)
	// let list_assets = await get_listed_asset('alienfrensnft')
	// console.log(list_assets[0].traits)
}

// main()

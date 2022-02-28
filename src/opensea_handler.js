const data_node = require('./data_node.js')
// const secret = require('./secret_node.js')
const opensea = require("opensea-js")
const Network = opensea.Network;
const RPCSubprovider = require("web3-provider-engine/subproviders/rpc");
const Web3ProviderEngine = require("web3-provider-engine");
const OpenSeaPort = opensea.OpenSeaPort;
const throttledQueue = require('throttled-queue');
const http = require('http')
const url = require('url');


var providerEngine = new Web3ProviderEngine();
var seaport = new OpenSeaPort(
  providerEngine,
  {
    networkName: Network.Main,
    apiKey: '9e72715b3e504813ac3ebc0512d473bf'
  },
  (arg) => console.log(arg)
);
providerEngine.start()

// Return listed of assets listed for sale
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

// return collection info
// floor, fee, volume, token addres, etc
async function get_collection(slug){
	try{
		const collect = await seaport.api.get('/api/v1/collection/' + slug)
		return collect
	} catch (ex) {
		console.log("couldn't get collection info")
	} 
}

// return all assets from collcetion
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
			try{
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
				if(offset % 250 === 0){
					console.log(offset)
				}
			} catch(e) {
				console.log(e.message)
			}
		
			
		} while(assets_length === 50)
	
		return assets_list
	}
}

// eh
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
			trimmed_asset['token_id'] = asset['tokenId']
			trimmed_asset['traits'] = asset['traits']
			trimmed_asset['name'] = asset['name']
			trimmed_asset['token_address'] = asset['tokenAddress']
			trimmed_asset['image_url'] = asset['imageUrl']
			trimmed_asset['slug'] = slug
			trimmed_asset['fee'] = asset.collection.devSellerFeeBasisPoints / 10000
			trimmed_asset['event_type'] = 'file'
			
			if(asset['image_url'] !== ''){
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
	console.log(assets_dict)
	const data = JSON.stringify(assets_dict);

	fs.writeFile('./collections/' + slug + '.json', data, (err) => {
    if (err) {
        throw err;
    }
    console.log("JSON data is saved.");
	})
}

async function read_assets(slug){
	var path = './collections/' + slug + '.json'
	var asset_data = fs.readFileSync(path, "utf8")
	asset_data = JSON.parse(asset_data.toString())
	// console.log(asset_data)
	// console.log(asset_data.assets.length)
	return asset_data
}

//order['orders'][o].taker !== '0x0000000000000000000000000000000000000000'
async function get_orders_window(address, time_window, token_ids){
  var offset = 0
  let search_time = get_ISOString(time_window)
  let search_time2 = get_ISOString_now()
  let orders_array = []
  var order = 0
  do{
  	await sleep(250)
    try{
    	if(token_ids){
    		console.log('hello')
    		order = await seaport.api.getOrders({
		      side: 0,
		      order_by: 'created_date',
		      asset_contract_address: address,
		      token_ids: token_ids,
		      listed_after: search_time,
		      listed_before: search_time2,
		      limit: 50,
		      offset: offset
		    })
    	} else {
    			order = await seaport.api.getOrders({
			      side: 0,
			      order_by: 'created_date',
			      maker: address,
			      listed_after: search_time,
			      listed_before: search_time2,
			      limit: 50,
			      offset: offset
			    })
    	}
	    
	    try{
        var username = order['orders'][0].makerAccount.user.username
      } catch(ex){
        username = 'Null'
      }
	    var order_length = order['orders'].length
	    for(let o of order.orders){
	    	orders_array.push(o)
	    }
    }
    catch(ex) {
    	order_length = 0
      console.log(ex.message)
      console.log('----error with buy orders')
    }
    offset += 50
  } while(order_length === 50)
  console.log(orders_array.length + ' bids made by ' + username)
  return orders_array
}

// buy nft with ETH
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

module.exports = { seaport, get_collection, get_assets, get_orders_window};
const opensea_handler = require('./opensea_handler.js')
const redis_handler = require('./redis_handler.js')
const data_node = require('./data_node.js')
const utils = require('./utils.js')

// Grab assets from database to avoid api rate limits. 
async function manual_queue_add(slug){
	var assets =  await opensea_handler.get_assets(slug)
	console.log('Getting assets for ' + slug + '...')
	for(let asset of assets){
		let trimmed_asset = {}
		trimmed_asset['token_id'] = asset.tokenId
		trimmed_asset['traits'] = asset.traits
    	trimmed_asset['token_address'] = asset.tokenAddress
    	trimmed_asset['slug'] = asset.collection.slug
    	trimmed_asset['fee'] = asset.collection.devSellerFeeBasisPoints / 10000
    	trimmed_asset['event_type'] = 'manual'
    	trimmed_asset['expiration'] = false
    	trimmed_asset['bid_multi'] = false

    	await redis_handler.push_asset_high_priority(trimmed_asset)
    	await redis_handler.print_queue_length('high')
	}
}
var wallet_set = data_node.WATCH_LIST

//No traits from orders :(
async function get_competitor(address, time_window){
	var start_time = Math.floor(+new Date())
	var orders =  await opensea_handler.get_orders_window(address, time_window)
	console.log('Getting orders for ' + address + '...')
    for(let o of orders){
    	let asset = {}
    	asset['token_id'] = o.asset.tokenId
    	asset['token_address'] = o.asset.tokenAddress
    	asset['slug'] = o.asset.collection.slug
    	asset['fee'] = o.asset.collection.devSellerFeeBasisPoints / 10000
    	asset['event_type'] = 'manual competitor'
    	asset['expiration'] = false
    	asset['bid_multi'] = false
    	asset['bid_amount'] = o.basePrice/1000000000000000000
    	if(wallet_set.includes(asset['slug'])){
    		console.log(asset)
 			await redis_handler.push_asset_high_priority(asset)
    		await redis_handler.print_queue_length('high')
    	}
    	
    }
    var end_time = Math.floor(+new Date())
	if (end_time - start_time < time_window){
		let wait_time = time_window - (end_time - start_time)
		await utils.sleep(wait_time)
	}
    get_competitor(address, time_window)
}

async function main(){
	const readline = require('readline-sync')	
	let slug = readline.question('collection: ')
	if(slug === 'comp'){
		let address = readline.question('address: ')
		let time_window = readline.question('window: ')
		get_competitor(address, time_window*1000)
	}
	// console.log(slug)
	// redis_handler.dump_queue('flash')
	manual_queue_add(slug)
}
main()
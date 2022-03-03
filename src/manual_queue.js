const opensea_handler = require('./opensea_handler.js')
const redis_handler = require('./redis_handler.js')
const data_node = require('./data_node.js')
const utils = require('./utils.js')
const mongo = require('./AssetsMongoHandler.js')



// Grab assets from database to avoid api rate limits. 
async function manual_queue_add(slug, event_type, exp, bid){
	let trait_bids = data_node.COLLECTION_TRAIT
	console.log('Getting assets for ' + slug + '...')
	// var assets =  await opensea_handler.get_assets(slug)
	var assets = await mongo.find({'slug':slug}, {})
	let collection_traits = trait_bids[slug]
	console.log('Trait bids: ' + collection_traits)
	for(let asset of assets){
		let trimmed_asset = {}
		trimmed_asset['token_id'] = asset.token_id
		trimmed_asset['traits'] = asset.traits
    	trimmed_asset['token_address'] = asset.token_address
    	trimmed_asset['slug'] = asset.slug
    	trimmed_asset['fee'] = asset.dev_seller_fee_basis_points / 10000
    	trimmed_asset['event_type'] = event_type
    	trimmed_asset['expiration'] = exp
    	trimmed_asset['bid_multi'] = false
    	trimmed_asset['bid_range'] = false
    	for(trait of asset.traits){
			if(collection_traits !== undefined && collection_traits[trait.trait_type.toLowerCase()]){
				if(collection_traits[trait.trait_type.toLowerCase()][trait.value.toLowerCase()]){
					// console.log(trait.value)
					// console.log(collection_traits[trait.trait_type][trait.value])
					// trimmed_asset['event_type'] = 'trait - ' + trait.value
					trimmed_asset['trait'] = trait.value
					trimmed_asset['bid_range'] = collection_traits[trait.trait_type.toLowerCase()][trait.value.toLowerCase()]
				}
			}
    	}
    	// if(trimmed_asset['trait']){
    	// 	continue
    	// }
    	trimmed_asset['bid_amount'] = bid
    	await redis_handler.redis_push_asset(trimmed_asset)
	}
	await redis_handler.print_queue_length('manual')
	console.log(slug + ' added.')
}
var wallet_set = data_node.WATCH_LIST

//No traits from orders :(
async function get_competitor(address, time_window, exp){
	var start_time = Math.floor(+new Date())
	var orders =  await opensea_handler.get_orders_window(address, time_window)
	console.log('Getting orders for ' + address + '...')
    for(let o of orders){
    	let asset = {}
    	try{
	        var username = o.makerAccount.user.username
	      } catch(ex){
	        username = 'Null'
	      }
    	asset['token_id'] = o.asset.tokenId
    	asset['token_address'] = o.asset.tokenAddress
    	asset['slug'] = o.asset.collection.slug
    	asset['fee'] = o.asset.collection.devSellerFeeBasisPoints / 10000
    	asset['event_type'] = 'competitor ' + username
    	asset['expiration'] = false
    	if(exp !== ''){
    		asset['expiration'] = exp/60
    	}
    	asset['bid_multi'] = false
    	asset['bid_amount'] = o.basePrice/1000000000000000000
    	if(wallet_set.includes(asset['slug'])){
    		// console.log(asset)
 			await redis_handler.redis_push_asset(asset)
    		// await redis_handler.print_queue_length('manual')
    	}	
    }
    var end_time = Math.floor(+new Date())
	if (end_time - start_time < time_window){
		let wait_time = time_window - (end_time - start_time)
		await utils.sleep(wait_time)
	}
    get_competitor(address, time_window, exp)
}

async function manual_queue_start(){
	
	await redis_handler.print_queue_length('manual')
	const readline = require('readline-sync')	
	let slug = readline.question('collection: ')
	if(slug === 'comp'){
		let address = readline.question('address: ')
		let time_window = readline.question('window: ')
		let exp = readline.question('expire: ')
		get_competitor(address, time_window*1000, exp)
	}
	manual_queue_add(slug, 'manual')
}
module.exports = { get_competitor, manual_queue_add};
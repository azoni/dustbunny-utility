const opensea_handler = require('../handlers/opensea_handler.js')
const redis_handler = require('../handlers/redis_handler.js')
const data_node = require('../data_node.js')
const utils = require('../utility/utils.js')
const mongo = require('../AssetsMongoHandler.js')

let wallet_set = data_node.WATCH_LIST
let bids_added = 0

async function listed_queue_add(event_type, exp, bid){
	var time_window = 3000
	let start_time = Math.floor(+new Date())
	let trait_bids = data_node.COLLECTION_TRAIT
	console.log('Getting listings...')
	var orders =  await opensea_handler.get_listed_lowered(time_window)
	
	bids_added = 0
    for(let o of orders){
    	try{
	    	let asset = {}
	    	asset['token_id'] = o.asset.tokenId
	    	asset['token_address'] = o.asset.tokenAddress
	    	asset['slug'] = o.asset.collection.slug
	    	if(wallet_set.includes(asset['slug'])){
		    	asset['fee'] = o.asset.collection.devSellerFeeBasisPoints / 10000
		    	asset['event_type'] = event_type 
		    	asset['expiration'] = .25
		    	asset['listed_price'] = o.basePrice/1000000000000000000
		    	let mongo_traits = await mongo.findOne({'slug': asset['slug'], 'token_id': asset['token_id']})
		    	asset['traits'] = mongo_traits.traits
		    	if(exp !== ''){
		    		asset['expiration'] = exp/60
		    	}
	    		bids_added += 1
	    		redis_handler.redis_push(event_type, asset);	
	    	}
    	} catch (e) {

    	}
    }
	await redis_handler.print_queue_length(event_type)
	console.log('bids added: ' + bids_added)
	let queue_length = await redis_handler.get_queue_length(event_type)
	var end_time = Math.floor(+new Date())
	if (end_time - start_time < time_window){
		let wait_time = time_window - (end_time - start_time)
		console.log('Queue ' + event_type + ': ' + queue_length)
		console.log('waiting: ' + wait_time + 'ms')
		await utils.sleep(wait_time)
	}
  listed_queue_add(event_type, exp, bid)
}

async function start() {
	listed_queue_add('listed', 15, false)
}

module.exports = { start, listed_queue_add };
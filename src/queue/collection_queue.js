//add assets without reasonable bids into queue
const data_node = require('../data_node.js')
const redis_handler = require('../handlers/redis_handler.js')
const utils = require('../utility/utils.js')
const opensea_handler = require('../handlers/opensea_handler.js')
const watchlistupdater = require('../utility/watchlist_retreiver.js');
const mongo = require('../AssetsMongoHandler.js')

let bids_added = 0

async function get_collection_bids(type, exp){
	let watch_list = watchlistupdater.getWatchList();
 	let start_time = Math.floor(+new Date())
  console.log('Adding to queue...' + ' event widnow: ' + time_window)
	let queue_length = await redis_handler.get_queue_length(type)
	console.log('bids added: ' + bids_added)
  bids_added = 0
  for(let address of wallet_orders){
  	await utils.sleep(250)
  	var orders =  await opensea_handler.get_orders_window(address, false, token_ids)
    try {
	    for(let o of orders){
	    	let asset = {}
	    	asset['token_id'] = o.asset.tokenId
	    	asset['token_address'] = o.asset.tokenAddress
	    	asset['slug'] = o.asset.collection.slug
	    	asset['fee'] = o.asset.collection.devSellerFeeBasisPoints / 10000
	    	asset['event_type'] = type 
	    	asset['expiration'] = .25
	    	if(exp !== ''){
	    		asset['expiration'] = exp/60
	    	}
        const watchListCollection = watch_list.find(({address}) => address === asset['token_address']);
        if(watchListCollection !== undefined && watchListCollection['tier'] !== 'skip'){
          asset['tier'] = watchListCollection['tier'];
	    		bids_added += 1
	    		let mongo_traits = await mongo.findOne({'slug': asset['slug'], 'token_id': asset['token_id']})
	    		try{
	    			asset['traits'] = mongo_traits.traits
	    			for(trait of asset.traits){
			    		let collection_traits = trait_bids[asset['slug']]
								if(collection_traits !== undefined && collection_traits[trait.trait_type.toLowerCase()]){
									if(collection_traits[trait.trait_type.toLowerCase()][trait.value.toLowerCase()]){
										let range = collection_traits[trait.trait_type.toLowerCase()][trait.value.toLowerCase()]
										if(!asset['bid_range']){
											asset['bid_range'] = range
											asset['trait'] = trait.value
										}
										if(range[1] > asset['bid_range'][1]){
											asset['trait'] = trait.value
											asset['bid_range'] = range
										}
									}
								}
		    		}
	    		} catch (e) {
	    			console.log(asset)
	    		}

	    		if (data_node.PRIORITY_COMP_WALLET.includes(address)) {
	    			asset['bid_amount'] = o.basePrice/1000000000000000000
	    			redis_handler.push_asset_high_priority(asset);
	    		} else {
	    			if(queue_length < 1000){
	    				asset['bid_amount'] = o.basePrice/1000000000000000000
	    			}
	    			redis_handler.redis_push_asset_flash(asset);
	    		}
	    	}
	    }
    }
    catch(ex) {
    	console.log(ex)
      console.log(ex.message)
      console.log('error ' + type + ' queue')
    }
	}
	var end_time = Math.floor(+new Date())
	if (end_time - start_time < time_window){
		let wait_time = time_window - (end_time - start_time)
		console.log('Queue ' + type + ': ' + queue_length)
		console.log('waiting: ' + wait_time + 'ms')
		await utils.sleep(wait_time)
	}
  get_competitor_bids(type, exp)
}

async function start(){
  await watchlistupdater.startLoop();
  get_collection_bids()
}
// start()
module.exports = { start, get_collection_bids };
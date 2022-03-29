const data_node = require('../data_node.js')
const redis_handler = require('../handlers/redis_handler.js')
const utils = require('../utility/utils.js')
const opensea_handler = require('../handlers/opensea_handler.js')
const watchlistupdater = require('../utility/watchlist_retreiver.js');
const mongo = require('../AssetsMongoHandler.js')


let bids_added = 0
let counter = 0
let wallet_orders = data_node.COMP_WALLETS
let trait_bids = data_node.COLLECTION_TRAIT

async function get_competitor_bids(type, exp){
	let watch_list = watchlistupdater.getWatchList();
 	var time_window = wallet_orders.length * 2000
 	let start_time = Math.floor(+new Date())
  let search_time = utils.get_ISOString(time_window)
  let search_time2 = utils.get_ISOString_now()
  console.log('Adding to queue...' + ' event widnow: ' + time_window)
  
	let queue_length = await redis_handler.get_queue_length(type)
	
	console.log('bids added: ' + bids_added)
  bids_added = 0
  for(let address of wallet_orders){
  	await utils.sleep(250)
  	var orders =  await opensea_handler.get_orders_window(address, time_window)
    try {
	    try{
        let username = order['orders'][0].makerAccount.user.username
      } catch(ex){
        username = 'Null'
      }
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
	    		counter += 1
	    		bids_added += 1
	    		let mongo_traits = await mongo.findOne({'slug': asset['slug'], 'token_id': asset['token_id']})
	    		if(mongo_traits === null) {
						const mongo_insert = require('../api_mongo_insert_to_db.js')
						await mongo_insert.add_asset(asset.slug, asset.token_address, asset.token_id)
						mongo_traits = await mongo.findOne({'slug': asset['slug'], 'token_id': asset['token_id']})
						console.log('Added to DB. --------------')
						console.log(mongo_traits)
					}
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
	    			redis_handler.redis_push('high', asset);
	    		} else {
	    			if(queue_length < 1000){
	    				asset['bid_amount'] = o.basePrice/1000000000000000000
	    			}
	    			redis_handler.redis_push('flash', asset);
	    		}
	    	}
	    }
    }
    catch(ex) {
    	console.log(ex)
      console.log(ex.message)
      console.log('error ' + type + ' queue')
    }
	  // console.log(counter + ' bids made by ' + username)
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

async function flash_queue_start(){
	redis_handler.dump_queue('flash')
	const readline = require('readline-sync')	
	let exp = readline.question('exp: ')
	if(exp === ''){
		exp = false
	}
	let type = readline.question('flash or high1, high2: ')
 	if(type === 'high1' || type === 'high2'){
 		if(type === 'high1'){
 			wallet_orders = data_node.PRIORITY_COMP_WALLET1
 		} else if(type === 'high2'){
 			wallet_orders = data_node.PRIORITY_COMP_WALLET2
 		}
 		type = 'high'
 	}
	get_competitor_bids(type, exp)
}

async function start(){
  await watchlistupdater.startLoop();
  flash_queue_start()
}
// start()
module.exports = { start, get_competitor_bids };
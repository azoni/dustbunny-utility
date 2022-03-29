const data_node = require('../data_node.js')
const redis_handler = require('../handlers/redis_handler.js')
const utils = require('../utility/utils.js')
const opensea_handler = require('../handlers/opensea_handler.js')
const mongo = require('../AssetsMongoHandler.js')
const mongo_handler = require('../handlers/mongo_handler.js')

let bids_added = 0
let counter = 0

async function get_competitor_bids(type, exp){
	let flash_wallets = await mongo_handler.get_flash_wallets()
	let wallet_orders = flash_wallets.map(({address}) => address.toLowerCase())
 	var time_window = wallet_orders.length * 2000
 	let start_time = Math.floor(+new Date())
  console.log('Adding to queue...' + ' event widnow: ' + time_window)
  
	let queue_length = await redis_handler.get_queue_length(type)
	
	console.log('bids added: ' + bids_added)
  bids_added = 0
  for(let address of wallet_orders){
  	await utils.sleep(250)
  	var orders =  await opensea_handler.get_orders_window(address, time_window)
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
				counter += 1
				bids_added += 1
				let mongo_traits = await mongo.findOne({'slug': asset['slug'], 'token_id': asset['token_id']})
				if(mongo_traits === null) {
					const mongo_insert = require('../api_mongo_insert_to_db.js')
					await mongo_insert.add_asset(asset.slug, asset.token_address, asset.token_id)
					mongo_traits = await mongo.findOne({'slug': asset['slug'], 'token_id': asset['token_id']})
					console.log(asset['slug'] + ' ' + asset['token_id'] + ' Added to DB.')
					
				}
				try{
					asset['traits'] = mongo_traits.traits
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
    catch(ex) {
      console.log(ex.message)
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
  flash_queue_start()
}
// start()
module.exports = { start, get_competitor_bids };
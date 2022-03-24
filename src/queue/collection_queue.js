//add assets without reasonable bids into queue
const redis_handler = require('../handlers/redis_handler.js')
const utils = require('../utility/utils.js')
const opensea_handler = require('../handlers/opensea_handler.js')
const mongo = require('../AssetsMongoHandler.js')

async function get_collection_bids(slug, exp){
	let blacklist_wallets = ['0x4d64bDb86C7B50D8B2935ab399511bA9433A3628', '0x18a73AaEe970AF9A797D944A7B982502E1e71556','0x1AEc9C6912D7Da7a35803f362db5ad38207D4b4A', '0x35C25Ff925A61399a3B69e8C95C9487A1d82E7DF']
	for(let w in blacklist_wallets){
		blacklist_wallets[w] = blacklist_wallets[w].toLowerCase()
	}
 	let start_time = Math.floor(+new Date())
  console.log('Adding to queue...' + slug)
	
  let bids_added = 0
	let order_count = 0
	let loop_counter = 0
	var assets = await mongo.find({'slug':slug}, {})
	// token_ids = assets.map(({ token_id }) => token_id);
	let token_ids = []
	let asset_contract_address = assets[0].token_address
	let temp_30_array = []
	let asset_count = 0
	let trait_dict = {}
	for(let asset of assets){
		trait_dict[asset.token_id] = asset.traits
		asset_count += 1
		temp_30_array.push(asset.token_id)
		if(temp_30_array.length === 30){
			token_ids.push(temp_30_array)
			temp_30_array = []
		}
		if(asset_count === assets.length){
			token_ids.push(temp_30_array)
		}
	}
  for(let token_array of token_ids){
		console.log(loop_counter + '/' + assets.length + ' for ' + assets[0].slug)
		loop_counter += 30
		let has_bids = {}
		let top_bids = 0
		let no_bids = 0
  	await utils.sleep(500)
		let asset_map = {}
  	var orders =  await opensea_handler.get_orders_window(asset_contract_address, false, token_array)
    try {	
	    for(let o of orders){
				has_bids[o.asset.tokenId] = true
	    	let asset = {}
	    	asset['token_id'] = o.asset.tokenId
				asset['traits'] = trait_dict[asset['token_id']]
	    	asset['token_address'] = o.asset.tokenAddress
	    	asset['slug'] = o.asset.collection.slug
	    	asset['fee'] = o.asset.collection.devSellerFeeBasisPoints / 10000
	    	asset['event_type'] = 'collection' 
	    	asset['expiration'] = .25
				asset['owner_address'] = o.makerAccount.address.toLowerCase()
	    	if(exp !== ''){
	    		asset['expiration'] = exp/60
	    	}
				if(exp < 15){
					asset['expiration'] = .25
				}
				order_count += 1
				asset['bid_amount'] = o.basePrice/1000000000000000000	
				if(!asset_map[asset['token_id']]){
					asset_map[o.asset.tokenId] = asset
				}
				else {
					if(asset['bid_amount'] > asset_map[asset['token_id']]['bid_amount']){
						asset_map[asset['token_id']] = asset
					}
				}
	    }
			for(let id of token_array){
				if(!has_bids[id]){
					no_bids += 1
					let asset = {}
					asset['token_id'] = id
					asset['token_address'] = asset_contract_address
					asset['slug'] = slug
					asset['event_type'] = 'no bids' 
					asset['expiration'] = .25
					if(exp !== ''){
						asset['expiration'] = exp/60
					}
					asset_map[asset['token_id']] = asset
				}
			}
			console.log('No bids: ' + no_bids)
			for(let a in asset_map){
				if(!blacklist_wallets.includes(asset_map[a]['owner_address'])){
					bids_added += 1
					await redis_handler.redis_push('collection', asset_map[a]); 
				} else{
					top_bids += 1
				}
			}
			console.log('Top bids: ' + top_bids)
    }
    catch(ex) {
    	console.log(ex)
      console.log(ex.message)
      console.log('error ')
    }
	}
	let queue_length = await redis_handler.get_queue_length('collection')
	console.log('orders found: ' + order_count)
	console.log('bids added: ' + bids_added)
	console.log('Queue collection: ' + queue_length)
	var end_time = Math.floor(+new Date())
	console.log('run time: ' + ((end_time - start_time)/60000).toFixed(2) + ' minutes')
	if (end_time - start_time < exp*60000){
		let wait_time = (end_time - start_time)
		console.log('Queue collection: ' + queue_length)
		// console.log('waiting: ' + wait_time/60000 + ' min')
		// await utils.sleep(wait_time)
	}
	exp = (end_time - start_time)/60000
  get_collection_bids(slug, exp)
}
async function start(){
	// const readline = require('readline-sync')
	// let slug = readline.question('slug: ')
	// let exp = readline.question('exp: ')
  // get_collection_bids(slug, exp)
	get_collection_bids(process.argv[3], process.argv[4])
}
// start()
module.exports = { start, get_collection_bids };
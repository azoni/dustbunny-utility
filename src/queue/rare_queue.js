//grab rares from data and throw into priority high queue if a bid is detected
const data_node = require('../data_node.js')
const opensea_handler = require('../handlers/opensea_handler.js')
const utils = require('../utility/utils.js')
const mongo = require('../AssetsMongoHandler.js')

//getOrders on 30 token IDs at once, possibly match expiration
async function start_listener(){
	let trait_bids = data_node.COLLECTION_TRAIT
	var exp = .33
	let token_ids = []
	var assets = await mongo.find({'slug':'doodles-official',  'traits.trait_type': 'face', 'traits.value': 'rainbow puke'}, {})
	let asset_contract_address = assets[0].token_address
	let temp_30_array = []
	for(let asset of assets){
		temp_30_array.push(asset.token_id)
		token_ids.push(temp_30_array)
		
	}
	var start_time = Math.floor(+new Date())
	for(let token_array of token_ids){
		await utils.sleep(250)
		var orders =  await opensea_handler.get_orders_window(asset_contract_address, 20000, token_array)
		console.log('Getting orders for ' + asset_contract_address + '...')
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
	    	asset['event_type'] = 'rare'
	    	asset['expiration'] = false
	    	if(exp !== ''){
	    		asset['expiration'] = exp/60
	    	}
	    	let mongo_traits = await mongo.findOne({'slug': asset['slug'], 'token_id': asset['token_id']})
	    	asset['traits'] = mongo_traits.traits
	    	for(trait of asset.traits){
	    		let collection_traits = trait_bids[asset['slug']]
				if(collection_traits !== undefined && collection_traits[trait.trait_type.toLowerCase()]){
					if(collection_traits[trait.trait_type.toLowerCase()][trait.value.toLowerCase()]){
						trimmed_asset['trait'] = trait.value
						trimmed_asset['bid_range'] = collection_traits[trait.trait_type.toLowerCase()][trait.value.toLowerCase()]
					}
				}
	    	}
	    	asset['bid_amount'] = o.basePrice/1000000000000000000
			console.log(asset)
	    }
	}
    var end_time = Math.floor(+new Date())
	if (end_time - start_time < 20000){
		let wait_time = 20000 - (end_time - start_time)
		console.log('waiting: ' + wait_time + 'ms')
		await utils.sleep(wait_time)
	}
	start_listener()
}
// start_listener()
module.exports = { start_listener};
//grab rares from data and throw into priority high queue if a bid is detected
const data_node = require('../data_node.js')
const opensea_handler = require('../handlers/opensea_handler.js')
const utils = require('../utility/utils.js')
const mongo = require('../AssetsMongoHandler.js')
const redis_handler = require('../handlers/redis_handler.js')

//getOrders on 30 token IDs at once, possibly match expiration
async function start_listener(){
	let trait_bids = data_node.COLLECTION_TRAIT
	var exp = 30
	let token_ids = []
	var assets = await mongo.find({'slug':'doodles-official', 'traits.trait_type': 'face', 'traits.value': 'rainbow puke'}, {})
	var assets2 = await mongo.find({'slug':'doodles-official', 'traits.trait_type': 'face', 'traits.value': 'shark'}, {})
	var assets3 = await mongo.find({'slug':'doodles-official', 'traits.trait_type': 'face', 'traits.value': 'puffer up'}, {})
	var assets4 = await mongo.find({'slug':'doodles-official', 'traits.trait_type': 'face', 'traits.value': 'ape'}, {})

	const arr = [...assets, ...assets2, ...assets3, ...assets4];
	console.log(arr.length)
	let asset_contract_address = assets[0].token_address
	let slug = assets[0].slug
	let temp_30_array = []
	let asset_count = 0
	for(let asset of arr){
		asset_count += 1
		temp_30_array.push(asset.token_id)
		if(temp_30_array.length === 30){
			token_ids.push(temp_30_array)
			temp_30_array = []
		}
		if(asset_count === arr.length){
			token_ids.push(temp_30_array)
		}
	}
	console.log(token_ids)
	var start_time = Math.floor(+new Date())
	for(let token_array of token_ids){
		await utils.sleep(250)
		var orders =  await opensea_handler.get_orders_window(asset_contract_address, 30000, token_array)
		console.log('Getting orders for ' + slug + '...')
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
	    	//asset['bid_amount'] = o.basePrice/1000000000000000000
	    	console.log(o.expirationTime - Math.floor(+new Date())/1000)
			console.log(asset['slug'] + ' ' + asset['token_id'] + ' ' + o.basePrice/1000000000000000000 + ' ' + asset['trait'] + ' ' + asset['bid_range'])
			await redis_handler.redis_push('rare', asset)
	    }
	}
    var end_time = Math.floor(+new Date())
	if (end_time - start_time < 30000){
		let wait_time = 30000 - (end_time - start_time)
		console.log('waiting: ' + wait_time + 'ms')
		await utils.sleep(wait_time)
	}
	start_listener()
}
// start_listener()
module.exports = { start_listener};
const opensea_handler = require('../handlers/opensea_handler.js')
const redis_handler = require('../handlers/redis_handler.js')
const data_node = require('../data_node.js')
const utils = require('../utility/utils.js')
const mongo = require('../AssetsMongoHandler.js')

async function staking_queue_add(slug, event_type, exp, bid, run_traits){
	let trait_bids = data_node.COLLECTION_TRAIT
	console.log('Getting unstaked assets for ' + slug + '...')
	// var assets =  await opensea_handler.get_assets(slug)
	var assets = await opensea_handler.get_assets_with_cursor(slug)
	let collection_traits = trait_bids[slug]
	let staking_wallets = await mongo.readStakingWallets()
	let staking_wallet;
	for(let w of staking_wallets){
		if(w.slug === slug){
			staking_wallet = w.address
			break
		}
	}
	let counter = 0
	console.log(staking_wallet)
	console.log('Trait bids: ' + collection_traits)
	for(let asset of assets){
		asset['fee'] = asset.dev_seller_fee_basis_points / 10000
    	asset['event_type'] = 'staking'
    	asset['expiration'] = exp
    	asset['bid_range'] = false
    	if(staking_wallet.toLowerCase() === asset.owner_address.toLowerCase()){
    		continue
    	}
    	for(trait of asset.traits){
			if(collection_traits !== undefined && collection_traits[trait.trait_type.toLowerCase()]){
				if(collection_traits[trait.trait_type.toLowerCase()][trait.value.toLowerCase()]){
					asset['trait'] = trait.value
					asset['bid_range'] = collection_traits[trait.trait_type.toLowerCase()][trait.value.toLowerCase()]
				}
			}
    	}
    	if(asset['trait'] && !run_traits){
    		continue
    	}
    	counter += 1
    	asset['bid_amount'] = bid
    	await redis_handler.redis_push(event_type, asset)
	}
	console.log('counter: ' + counter)
	await redis_handler.print_queue_length(event_type)
	console.log(slug + ' added.')
}

async function start(){
	staking_queue_add('metahero-generative', 'staking', .33, false, false)
}

module.exports = { start, staking_queue_add};
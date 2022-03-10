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

	const slugs_staking_wallets = staking_wallets
		.filter(el => el.slug === slug)
		.map(({ address }) => address.toLowerCase());

	let counter = 0
	console.log('Trait bids: ' + collection_traits)
	for(let asset of assets){
		asset['fee'] = asset.dev_seller_fee_basis_points / 10000
    	asset['event_type'] = 'staking'
    	asset['expiration'] = exp
    	asset['bid_range'] = false
        if (slugs_staking_wallets.includes(asset.owner_address.toLowerCase())) {
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
	let exp = 15
	while(true){
		let start_time = Math.floor(+new Date())
		await staking_queue_add('critterznft', 'staking', exp/60, false, false)
		await staking_queue_add('sappy-seals', 'staking', exp/60, false, false)
		await staking_queue_add('anonymice', 'staking', exp/60, false, false)
		await staking_queue_add('genesis-creepz', 'staking', exp/60, false, false)
		await staking_queue_add('metahero-generative', 'staking', exp/60, false, false)
		await staking_queue_add('metroverse', 'staking', exp/60, false, true)
		await staking_queue_add('ether-orcs', 'staking', exp/60, false, true)
		//await utils.sleep(exp*60000)
		let end_time = Math.floor(+new Date())
		if (end_time - start_time < exp*60){
			let wait_time = exp*60 - (end_time - start_time)
			console.log('waiting: ' + wait_time + 'ms')
			await utils.sleep(wait_time)
		}
	}
}

module.exports = { start, staking_queue_add};
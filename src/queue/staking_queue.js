async function staking_queue_add(slug, event_type, exp, bid, run_traits){
	let trait_bids = data_node.COLLECTION_TRAIT
	console.log('Getting unstaked assets for ' + slug + '...')
	// var assets =  await opensea_handler.get_assets(slug)
	var assets = await opensea_handler.get_unstaked_assets(slug)
	let collection_traits = trait_bids[slug]
	console.log('Trait bids: ' + collection_traits)
	for(let asset of assets){
		let trimmed_asset = {}
		trimmed_asset['token_id'] = asset.token_id
		trimmed_asset['traits'] = asset.traits
    	trimmed_asset['token_address'] = asset.token_address
    	trimmed_asset['slug'] = asset.slug
    	trimmed_asset['fee'] = asset.dev_seller_fee_basis_points / 10000
    	trimmed_asset['event_type'] = 'staking'
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
    	if(trimmed_asset['trait'] && !run_traits){
    		continue
    	}
    	trimmed_asset['bid_amount'] = bid
    	await redis_handler.redis_push(event_type, trimmed_asset)
	}
	await redis_handler.print_queue_length(event_type)
	console.log(slug + ' added.')
}

module.exports = { staking_queue_add};
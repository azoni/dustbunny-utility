const opensea_handler = require('../handlers/opensea_handler.js')
const redis_handler = require('../handlers/redis_handler.js')
const data_node = require('../data_node.js')
const utils = require('../utility/utils.js')
const mongo = require('../AssetsMongoHandler.js')

async function staking_queue_add(slug, exp){
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
			if (slugs_staking_wallets.includes(asset.owner_address.toLowerCase())) {
			continue
		}
		counter += 1
		asset['bid_amount'] = false
		await redis_handler.redis_push('staking', asset)
	}
	console.log('counter: ' + counter)
	await redis_handler.print_queue_length('staking')
	console.log(slug + ' added.')
}

async function start(){
	let exp = 30
	while(true){
		let start_time = Math.floor(+new Date())
		// await staking_queue_add('critterznft', exp/60)
		// await staking_queue_add('sappy-seals', exp/60)
		// await staking_queue_add('anonymice', exp/60)
		// await staking_queue_add('genesis-creepz', exp/60)
		// await staking_queue_add('metahero-generative', exp/60)
		// await staking_queue_add('metroverse-genesis', exp/60)
		await staking_queue_add('metroverse-blackout', exp/60)
		// await staking_queue_add('ether-orcs', exp/60)
		// await staking_queue_add('nft-worlds', exp/60)
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
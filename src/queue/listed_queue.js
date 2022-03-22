const opensea_handler = require('../handlers/opensea_handler.js')
const redis_handler = require('../handlers/redis_handler.js')
const data_node = require('../data_node.js')
const utils = require('../utility/utils.js')
const mongo = require('../AssetsMongoHandler.js')
const watchlistupdater = require('../utility/watchlist_retreiver.js');

let wallet_set;
let bids_added = 0

async function listed_queue_add(event_type, exp, bid) {
	var time_window = 3000
	let start_time = Math.floor(+new Date())
	let trait_bids = data_node.COLLECTION_TRAIT
	let watch_list = watchlistupdater.getWatchList();
	console.log('Getting listings...')
	var orders =  await opensea_handler.get_listed_lowered(time_window);
	
	bids_added = 0
	for(let o of orders){
		try{
			let asset = {}
			asset['token_id'] = o.asset.tokenId
			asset['token_address'] = o.asset.tokenAddress
			asset['slug'] = o.asset.collection.slug
			wallet_set = watchlistupdater.getWatchListSlugsOnly();
			const watchListCollection = watch_list.find(({address}) => address === asset['token_address']);
			if(watchListCollection !== undefined){
				asset['tier'] = watchListCollection['tier'];
				asset['fee'] = o.asset.collection.devSellerFeeBasisPoints / 10000
				asset['event_type'] = event_type
				asset['expiration'] = .25
				asset['listed_price'] = o.basePrice/1000000000000000000
				console.log(asset)
				let mongo_traits = await mongo.findOne({'slug': asset['slug'], 'token_id': asset['token_id']})
				asset['traits'] = mongo_traits.traits
				if(exp !== ''){
					asset['expiration'] = exp/60
				}
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
							console.log('trait found!')
						}
					}
				}
				bids_added += 1
				const command = {
					hash: `${asset['slug']}:${asset['token_id']}`,
					slug: asset['slug'],
					collection_address: asset['token_address'],
					token_ids: [asset['token_id']],
					time_suggestion: 30*60_000
				}
				redis_handler.redis_push(event_type, asset);
				let focus_list = ['boredapeyachtclub', 'doodles-official', 'mutant-ape-yacht-club', 'azuki', 'cloneX']
				if(focus_list.includes(asset['slug'])){
					redis_handler.redis_push_command(command)
				}
				
			}
		} catch (e) {
		}
	}
	await redis_handler.print_queue_length(event_type)
	console.log('bids added: ' + bids_added)
	let queue_length = await redis_handler.get_queue_length(event_type)
	var end_time = Math.floor(+new Date())
	if (end_time - start_time < time_window){
		let wait_time = time_window - (end_time - start_time)
		console.log('Queue ' + event_type + ': ' + queue_length)
		console.log('waiting: ' + wait_time + 'ms')
		await utils.sleep(wait_time)
	}
  listed_queue_add(event_type, exp, bid)
}

async function start() {
  await watchlistupdater.startLoop();
  listed_queue_add('listed', 15, false)
}

module.exports = { start, listed_queue_add };
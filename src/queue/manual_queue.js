const opensea_handler = require('../handlers/opensea_handler.js')
const redis_handler = require('../handlers/redis_handler.js')
const data_node = require('../data_node.js')
const utils = require('../utility/utils.js')
const mongo = require('../AssetsMongoHandler.js')
const watchlistupdater = require('../utility/watchlist_retreiver.js');
let watchlistLoopStarted = false;

// Grab assets from database to avoid api rate limits. 
async function manual_queue_add(slug, event_type, exp, bid, run_traits){
	await watchlistupdater.startLoop();
	let trait_bids = data_node.COLLECTION_TRAIT
	let watch_list = watchlistupdater.getWatchList();
	console.log('Getting assets for ' + slug + '...')
	// var assets =  await opensea_handler.get_assets(slug)
	var assets = await mongo.find({'slug':slug}, {})
	let collection_traits = trait_bids[slug]
	console.log('Trait bids: ' + collection_traits)
	for(let asset of assets){
		let trimmed_asset = {}
		trimmed_asset['token_id'] = asset.token_id
		trimmed_asset['traits'] = asset.traits
    	trimmed_asset['token_address'] = asset.token_address
    	trimmed_asset['slug'] = asset.slug
    	trimmed_asset['fee'] = asset.dev_seller_fee_basis_points / 10000
    	trimmed_asset['event_type'] = event_type
    	trimmed_asset['expiration'] = exp
    	trimmed_asset['bid_range'] = false
    	let watchListCollection = watch_list.find(({address}) => address === trimmed_asset['token_address']);
    	try{
    		trimmed_asset['tier'] = watchListCollection['tier'];
    	} catch(e){
    		console.log(trimmed_asset['slug'])
    	}
    	
    	for(trait of asset.traits){
			if(collection_traits !== undefined && collection_traits[trait.trait_type.toLowerCase()]){
				if(collection_traits[trait.trait_type.toLowerCase()][trait.value.toLowerCase()]){
					let range = collection_traits[trait.trait_type.toLowerCase()][trait.value.toLowerCase()]
					if(!trimmed_asset['bid_range']){
						trimmed_asset['bid_range'] = range
						trimmed_asset['trait'] = trait.value
					}
					if(range[1] > trimmed_asset['bid_range'][1]){
						trimmed_asset['trait'] = trait.value
						trimmed_asset['bid_range'] = range
					}
				}
			}
    	}
    	if(trimmed_asset['trait'] && run_traits === 'skip'){
    		continue
    	}
    	if(!trimmed_asset['trait'] && run_traits === 'only'){
    		continue
    	}
    	trimmed_asset['bid_amount'] = bid
    	await redis_handler.redis_push(event_type, trimmed_asset)
	}
	await redis_handler.print_queue_length(event_type)
	console.log(slug + ' added.')
}
let wallet_set = undefined;

//No traits from orders :(
async function get_competitor(address, time_window, exp){
	if (!watchlistLoopStarted) {
		await watchlistupdater.startLoop();
		watchlistLoopStarted = true;
	}
	wallet_set = watchlistupdater.getWatchListSlugsOnly();
	var start_time = Math.floor(+new Date())
	var orders =  await opensea_handler.get_orders_window(address, time_window)
	console.log('Getting orders for ' + address + '...')
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
    	asset['event_type'] = 'competitor ' + username
    	asset['expiration'] = false
    	if(exp !== ''){
    		asset['expiration'] = exp/60
    	}
    	asset['bid_multi'] = false
    	asset['bid_amount'] = o.basePrice/1000000000000000000
    	if(wallet_set.includes(asset['slug'])){
    		// console.log(asset)
 			await redis_handler.redis_push_asset(asset)
    		// await redis_handler.print_queue_length('manual')
    	}	
    }
    var end_time = Math.floor(+new Date())
	if (end_time - start_time < time_window){
		let wait_time = time_window - (end_time - start_time)
		await utils.sleep(wait_time)
	}
    get_competitor(address, time_window, exp)
}

async function manual_queue_start(){
	await redis_handler.print_queue_length('manual')
	const readline = require('readline-sync')	
	let slug = readline.question('collection: ')
	if(slug === 'comp'){
		let address = readline.question('address: ')
		let time_window = readline.question('window: ')
		let exp = readline.question('expire: ')
		get_competitor(address, time_window*1000, exp)
	}
	manual_queue_add(slug, 'manual')
}
async function start(){
	// await watchlistupdater.startLoop();
	const readline = require('readline-sync')
	let slug = readline.question('slug: ')
	let exp = readline.question('exp: ')
	let run_traits = readline.question('traits: ')
	let bid = ''//readline.question('bid: ')
	if(exp === ''){
		exp = 20
	}
	if(bid === ''){
		bid = false
	}
	if(run_traits === ''){
		run_traits = false
	}
	while(true){
		let start_time = Math.floor(+new Date())
		manual_queue_add(slug, 'manual', exp/60, bid, run_traits)
		//await utils.sleep(exp*60000)
		let end_time = Math.floor(+new Date())
		if (end_time - start_time < exp*60000){
			let wait_time = exp*60000 - (end_time - start_time)
			console.log('waiting: ' + (wait_time/60000).toFixed(2) + 'min')
			await utils.sleep(wait_time)
		}
	}
}
module.exports = { start, get_competitor, manual_queue_add};
const opensea_handler = require('./opensea_handler.js')
const redis_handler = require('./redis_handler.js')
const utils = require('./utils.js')

// Grab assets from database to avoid api rate limits. 
async function manual_queue_add(slug){
	var assets =  await opensea_handler.get_assets(slug)
	console.log('Getting assets for ' + slug + '...')
	for(let asset of assets){
		let trimmed_asset = {}
		trimmed_asset['token_id'] = asset.tokenId
		trimmed_asset['traits'] = asset.traits
    	trimmed_asset['token_address'] = asset.tokenAddress
    	trimmed_asset['slug'] = asset.collection.slug
    	trimmed_asset['fee'] = asset.collection.devSellerFeeBasisPoints / 10000
    	trimmed_asset['event_type'] = 'manual'
    	trimmed_asset['expiration'] = false
    	trimmed_asset['bid_multi'] = false

    	console.log(trimmed_asset)
	}
}

async function main(){
	// await redis_handler.print_queue_length('flash')
	const readline = require('readline-sync')	
	let slug = readline.question('Which collection? ')
	// console.log(slug)
	// redis_handler.dump_queue('flash')
	manual_queue_add(slug)
}
main()
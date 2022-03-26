const opensea_handler = require('../handlers/opensea_handler.js')
const redis_handler = require('../handlers/redis_handler.js')
const utils = require('../utility/utils.js')
const mongo = require('../AssetsMongoHandler.js')

// Grab assets from database to avoid api rate limits. 
async function add_trait_queue(slug, exp){
	console.log('Getting assets for ' + slug + '... assets:' + assets.length)
	let counter = 0
	let traits = await mongo.read_traits(slug)
	let assets = []
	console.log(traits.traits)
	let traits_dict = traits.traits
	for(let trait in traits_dict){
		query = {slug:slug, traits: {'$elemMatch': { 'value': { "$regex" : Object.keys(traits_dict[trait])[0] , "$options" : "i"}, 'trait_type': { "$regex" : trait , "$options" : "i"}}}} 
		let temp_assets = await mongo.find(query, {$caseSensitive: false})
		console.log(trait + ' '  + traits_dict[trait])
		for(let a of temp_assets){
			assets.push(a)
		}
	}
	for(let asset of assets){
		let trimmed_asset = {}
		trimmed_asset['token_id'] = asset.token_id
		trimmed_asset['traits'] = asset.traits
		trimmed_asset['token_address'] = asset.token_address
		trimmed_asset['slug'] = asset.slug
		trimmed_asset['event_type'] = 'scheduled'
		trimmed_asset['expiration'] = exp

		await redis_handler.redis_push(event_type, trimmed_asset)
		counter += 1
	}
	await redis_handler.print_queue_length(event_type)
	console.log(slug + ' added.')
}

async function start(){
	const readline = require('readline-sync')
	let slug = readline.question('slug: ')
	let exp = readline.question('exp: ')
	add_trait_queue(slug ,exp/60)
}
module.exports = { start, add_trait_queue};
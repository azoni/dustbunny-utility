//add to queue based on competition
const opensea_handler = require('./opensea_handler.js')
const data_node = require('./data_node.js')
const etherscan_handler = require('./etherscan_handler.js')
const redis_handler = require('./redis_handler.js')
const manual_queue = require('./manual_queue.js')

const smart_list = data_node.SMART_WATCH_LIST

async function start(){
	let bid_dict = {}
	let final_product = []
	// var orders = await opensea_handler.get_orders_window('all', 60000)
	// console.log(orders)
	// console.log(orders.length)
	let total_weth = 0
	for(let account in wallets){
		let balance = await etherscan_handler.get_weth_balance(wallets[account]['address'])
		wallets[account]['balance'] = balance
		total_weth += balance
	}
	for(let acc in wallets){
		wallets[acc]['ratio'] = wallets[acc]['balance']/total_weth
	}
	console.log(wallets)
	console.log('total weth: ' + total_weth.toFixed(2))
	let allowed_collections = []
	// to get full coverage do floor < (balance/10)/wallets.length
	for(let slug of smart_list){
		let floor = await redis_handler.client.GET(`${slug}:floor`)
		floor = parseFloat(floor)
		//floor*asset_count < total_weth * 1000
		//exp based on run time (750bids/min)
		// subtract fee from .9
		if((floor * .9) < total_weth/10){
			allowed_collections.push(slug)
		}
	}
	let orders = await opensea_handler.get_orders_window('all', 30000)
	console.log(orders.length)
	for(let o of orders){
		try{
			let slug = o.asset.collection.slug
			if(allowed_collections.includes(slug)){
				if(bid_dict[slug]){
					bid_dict[slug] += 1
				} else {
					bid_dict[slug] = 1
				}
			}	
		} catch(e){
			console.log(e.message)
		}
	}
	for(var c of allowed_collections){
		if(bid_dict[c] < 10 || !bid_dict[c]){
			let collection = await opensea_handler.get_collection(c)
			try{
				console.log(c + ' ' + bid_dict[c] + ' size: ' + collection.collection.stats.total_supply)
				let final_collection = {}
				final_collection['slug'] = c
				final_collection['supply'] = collection.collection.stats.total_supply
				final_collection['bids'] = bid_dict[c] 
				final_product.push(final_collection)
			} catch (e){
				console.log(e)
			}
			
		}
	}
	console.log(final_product)
	for(let coll of final_product){
		await manual_queue.manual_queue_add(coll.slug)
		console.log(coll.slug + ' added.')
	}
}

module.exports = { start };
// use weth balances to determine how often an account bids
let wallets = {
	'wallet1': {
		username: 'DustBunny_19',
		address: '0x4d64bDb86C7B50D8B2935ab399511bA9433A3628'
		},
	'wallet2': {
		username: 'DustBunny_20',
		address: '0x18a73AaEe970AF9A797D944A7B982502E1e71556'
	}, 
	'wallet3': {
		username: 'DustBunny_21',
		address: '0x1AEc9C6912D7Da7a35803f362db5ad38207D4b4A'
	}, 
	'wallet4': {
		username: 'DustBunny_22',
		address: '0x35C25Ff925A61399a3B69e8C95C9487A1d82E7DF'
	}, 
}

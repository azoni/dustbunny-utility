//add to queue based on competition
const opensea_handler = require('./opensea_handler.js')
const data_node = require('./data_node.js')
const etherscan_handler = require('./etherscan_handler.js')
const redis_handler = require('./redis_handler.js')

const smart_list = data_node.SMART_WATCH_LIST

async function start(){

	// var orders = await opensea_handler.get_orders_window('all', 60000)
	// console.log(orders)
	// console.log(orders.length)
	let total_weth = 0
	for(let account in wallets){
		let balance = await etherscan_handler.get_weth_balance(wallets[account]['address'])
		total_weth += balance
	}
	console.log('total weth: ' + total_weth.toFixed(2))
	let allowed_collections = []
	for(let slug of smart_list){
		let floor = await redis_handler.client.GET(`${slug}:floor`)
		floor = parseFloat(floor)
		//floor*asset_count < total_weth * 1000
		//exp based on run time (750bids/min)
		if(floor < total_weth/10){
			console.log(slug + ': ' + floor.toFixed(2))
			allowed_collections.push(slug)
		}
	}
	let orders = await opensea_handler.get_orders_window('all', 5000)
	console.log(orders)
	console.log(orders.length)
}
module.exports = { start };

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

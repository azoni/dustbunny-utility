const node_redis = require('redis')
const utils = require('../utility/utils.js')
const mongo = require('../AssetsMongoHandler.js')
const watchlistupdater = require('../utility/watchlist_retreiver.js');
let watch_list;

const client = node_redis.createClient({
	url: "redis://10.0.0.80:6379",
});

async function start_connection(){
	await watchlistupdater.startLoop();
	watch_list = watchlistupdater.getWatchList();
	client.connect();
	client.on('error', (err) => console.log('Redis Client Error', err));
}

async function dump_queue(queue_name){
	console.log(await client.LLEN("queue:" + queue_name))
	client.DEL('queue:' + queue_name)
	console.log(queue_name + ' queue dumped')
}

async function print_queue_length(queue_name){
	console.log('Queue ' + queue_name + ': ' + await client.LLEN("queue:" + queue_name))
}

async function get_queue_length(queue_name){
	return await client.LLEN("queue:" + queue_name)
}

async function redis_push(queue_name ,asset) {
	// let traits = mongo.read_traits(asset['slug'])
	// let watchListCollection = watch_list.find(({address}) => address === asset['token_address']);
	// try{
	// 	trimmed_asset['tier'] = watchListCollection['tier'];
	// } catch(e){
	// 	console.log(trimmed_asset['slug'])
	// }
	// console.log(traits.traits.fur)
	// let max_bid = asset['bid_range']
	// let floor_price = await redis_handler.client.GET(`${'cool-cats-nft'}:stats`)
	// floor_price = JSON.parse(floor_price)
	// console.log(floor_price.floor_price)
	// console.log(floor_price.dev_seller_fee_basis_points/10000)
	// //if asset[bid_range] use that && asset['bid_amount]
	// if(watchListCollection !== undefined && watchListCollection['tier'] !== 'skip'){
	// 	await client.rPush('queue:' + queue_name, JSON.stringify(asset));
	// }
	await client.rPush('queue:' + queue_name, JSON.stringify(asset));

}

async function redis_push_asset(asset) {
	await client.rPush('queue:manual', JSON.stringify(asset));
}

async function redis_push_asset_flash(asset) {
	await client.rPush('queue:flash', JSON.stringify(asset));
}

async function push_asset_high_priority(asset) {
	await client.rPush('queue:high', JSON.stringify(asset));
}

async function redis_command_pop() {
	let data = await client.lPopCount('focus:commands', 30);
	return data;
}

async function redis_push_command(command) {
	return client.rPush('focus:commands', JSON.stringify(command));
}

//http method - client pull
async function redis_queue_pop(){
	let pop_count = 2
	let high_queue_data = await client.lPopCount('queue:high', pop_count)

	if(high_queue_data !== null && high_queue_data !== undefined && high_queue_data.length > 0){
		return high_queue_data
	} 
	let rare_queue_data = await client.lPopCount('queue:rare', pop_count)
	if(rare_queue_data !== null && rare_queue_data !== undefined && rare_queue_data.length > 0){
		return rare_queue_data
	}
	let listed_queue_data = await client.lPopCount('queue:listed', pop_count)
	if(listed_queue_data !== null && listed_queue_data !== undefined && listed_queue_data.length > 0){
		return listed_queue_data
	} 
	let transfer_queue_data = await client.lPopCount('queue:transfer', pop_count)
	if(transfer_queue_data !== null && transfer_queue_data !== undefined && transfer_queue_data.length > 0){
		return transfer_queue_data
	} 
	let staking_queue_data = await client.lPopCount('queue:staking', pop_count)
	if(staking_queue_data !== null && staking_queue_data !== undefined && staking_queue_data.length > 0){
		return staking_queue_data
	}
	let collection_queue_data = await client.lPopCount('queue:collection', pop_count)
	if(collection_queue_data !== null && collection_queue_data !== undefined && collection_queue_data.length > 0){
		return collection_queue_data
	}
	let flash_queue_data = await client.lPopCount('queue:flash', pop_count)
	if(flash_queue_data !== null && flash_queue_data !== undefined && flash_queue_data.length > 0){
		return flash_queue_data
	}
	let manual_queue_data = await client.lPopCount('queue:manual', pop_count)
	if(manual_queue_data !== null && manual_queue_data !== undefined && manual_queue_data.length > 0){
		return manual_queue_data
	}

	let smart_queue_data = await client.lPopCount('queue:smart', pop_count)
	if(smart_queue_data !== null && smart_queue_data !== undefined && smart_queue_data.length > 0){
		return smart_queue_data
	}
	return await client.lPopCount('queue:flash', pop_count)
}

module.exports = {
	redis_push_command,
	redis_command_pop,
	client,
	start_connection, redis_push,
	print_queue_length,
	dump_queue,
	push_asset_high_priority,
	redis_push_asset,
	redis_queue_pop,
	get_queue_length,
	redis_push_asset_flash
};

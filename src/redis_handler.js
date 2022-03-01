const node_redis = require('redis')
const utils = require('./utils.js')

const client = node_redis.createClient({
	url: "redis://10.0.0.80:6379",
});

async function start_connection(){
	client.connect();
	client.on('error', (err) => console.log('Redis Client Error', err));
}


async function dump_queue(queue_name){
	console.log(await client.LLEN("queue:" + queue_name))
	client.DEL('queue:' + queue_name)
	console.log(queue_name + ' queue dumped')
	console.log(await client.LLEN("queue:" + queue_name))
}
async function print_queue_length(queue_name){
	console.log('Queue ' + queue_name + ': ' + await client.LLEN("queue:" + queue_name))
}
async function get_queue_length(queue_name){
	return await client.LLEN("queue:" + queue_name)
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
//http method - client pull
async function redis_queue_pop(){
	let pop_count = 2
	let queue_data = await client.lPopCount('queue:high', pop_count)

	if(queue_data !== null && queue_data !== undefined && queue_data.length > 0){
		return queue_data
	} 
	else {
		let manual_queue_data = await client.lPopCount('queue:manual', pop_count)
		if(manual_queue_data !== null && manual_queue_data !== undefined && manual_queue_data.length > 0){
			return manual_queue_data
		}
		else {
			return await client.lPopCount('queue:flash', pop_count)
		}
	}
}

module.exports = { client, start_connection, print_queue_length, dump_queue, push_asset_high_priority, redis_push_asset, redis_queue_pop , get_queue_length, redis_push_asset_flash };
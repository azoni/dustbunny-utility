const node_redis = require('redis')
const client = node_redis.createClient({
	url: "redis://10.0.0.77:6379",
});
client.connect();
client.on('error', (err) => console.log('Redis Client Error', err));

async function push_asset_high_priority(asset) {
	await client.rPush('queue:high', JSON.stringify(asset));
}
async function dump_queue(queue_name){
	client.DEL('queue:' + queue_name)
	console.log(await client.LLEN("queue:" + queue_name))
}
async function get_queue_length(queue_name){
	console.log('Queue: ' + await client.LLEN("queue:" + queue_name))
}

async function manual_queue_add(slug){

}

async function main(){
	const readline = require('readline-sync')	
	let start_function = readline.question('Which collection? ')
	console.log(start_function)
	dump_queue('flash')
	manual_queue_add(start_function)
}
main()
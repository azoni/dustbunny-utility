const manual = require('./queue/manual_queue.js')
const staking = require('./queue/staking_queue.js')
const rare = require('./queue/rare_queue.js')
const listed = require('./queue/listed_queue.js')
const flash = require('./queue/flash_queue.js')
const transfer = require('./queue/transfer_queue.js')
const smart = require('./queue/smart_queue.js')
const focus = require('./queue/focus_queue.js');
const collection = require('./queue/collection_queue.js');
const http = require('http')
const url = require('url');
const myIp  = require('./utility/what-is-my-ip.js');
const redis_handler = require('./handlers/redis_handler.js')
const mongo = require('./AssetsMongoHandler.js')
const utils = require('./utility/utils.js')
const opensea_handler = require('./handlers/opensea_handler.js')

const requestListener = function(req, res){
	    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Request-Method', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST');
    res.setHeader('Access-Control-Allow-Headers', '*');
    if ( req.method === 'OPTIONS' ) {
        res.writeHead(200);
        res.end();
        return;
    }
 	const urlParts = url.parse(req.url, true);
	res.writeHead(200)
	// console.log(req.url)
	if(req.url === '/redis_queue_pop'){

		redis_handler.redis_queue_pop().then((val) => {
			val = val || [];
			res.write('[');
			let first = true;
			for (const el of val) {
				if (!first) {
					res.write(',');
				} else {
					first = false;
				}
				res.write(el);
			}
			res.end(']');
		});
	} else if (urlParts.pathname === '/collectionstats' && req.method === 'GET') {
		const collectionname = urlParts.query?.name;
		if (collectionname) {
			redis_handler.client.GET(`${collectionname}:stats`)
			.then(x => res.end(x))
			.catch(x => {
				console.error(x);
				res.end();
			});
		} else {
			res.end('null');
		}
	} else if (req.url === '/floor' && req.method === 'POST') {
		let bod = [];
		req.on('error', (err) => {
			console.error(err);
		})
		.on('data', (chunk) => {
			bod.push(chunk);
		})
		.on('end', () => {
			bod = Buffer.concat(bod).toString();
			if (bod) {
				try {
					const r = JSON.parse(bod);
					if (r.collection && typeof r.collection === 'string' && r.floor >= 0) {
						const key = `${r.collection}:floor`;
						redis_handler.client.SETEX(key, 3600, r.floor).catch(x=>console.log(x));
						if (r.stats) {
							const statKey = `${r.collection}:stats`
							redis_handler.client.SETEX(statKey, 3600, JSON.stringify(r.stats)).catch(x=>console.log(x));
						}
					}
				} catch (ex) {
					console.log(ex);
				}
			}
			res.end();
		})
	} else if (urlParts.pathname === '/floor' && req.method === 'GET') {
		const collectionname = urlParts.query?.name;
		if (collectionname) {
			redis_handler.client.GET(`${collectionname}:floor`).then(x => res.end(x));
		} else {
			res.end('null');
		}
	} else if (urlParts.pathname === '/length' && req.method === 'GET') {
			redis_handler.get_queue_length('flash').then(x => res.end(x + '')).catch(_=>res.end('-1'));
	} else {
		res.end('{error:"bye you"}');
	}
}

function connect(){
	const server = http.createServer(requestListener)
	server.listen(3000, myIp, () => {
		console.log('Server is running')
	})
}
async function add_focus(){
	//basePrice/1000000000000000000
	// let assets = await opensea_handler.get_assets_with_cursor('boredapeyachtclub')
	let token_array = ['3132']//, '2874', '3485', '4865', '4019', '7165', '5536', '7184']
	for(let token of token_array){
		let asset = await mongo.readAssetBySlug('azuki', token)
		let trimmed_asset = {}
		trimmed_asset['token_id'] = asset.token_id
		trimmed_asset['traits'] = asset.traits
		trimmed_asset['token_address'] = asset.token_address
		trimmed_asset['slug'] = asset.slug
		trimmed_asset['fee'] = asset.dev_seller_fee_basis_points / 10000
		trimmed_asset['event_type'] = 'hyper'
		trimmed_asset['expiration'] = .25
		trimmed_asset['bid_range'] = false
		trimmed_asset['tier'] = 'high';
		const command1 = {
			hash: `${trimmed_asset['slug']}:${trimmed_asset['token_id']}`,
			slug: trimmed_asset['slug'],
			collection_address: trimmed_asset['token_address'],
			token_ids: [trimmed_asset['token_id']],
			time_suggestion: 600*60_000
		}
		await redis_handler.redis_push_command(command1)
		console.log(token + ' added.')
	}
}
async function run_interactive(){

	const readline = require('readline-sync')	
	let command = process.argv[2]
	if(command === 'comp'){
		let address = readline.question('address: ')
		let time_window = readline.question('window: ')
		let exp = readline.question('expire: ')
		manual.get_competitor(address, time_window*1000, exp)
		// add option for flat bid, and expiration
	} else if(command === 'man'){
		manual.start()
	} else if(command === 'add-focus'){
		add_focus()
	} else if(command === 'flash'){
		flash.start()
	} else if(command === 'staking'){
		staking.start()
	} else if(command === 'listed'){
		listed.start()
	} else if(command === 'rare'){
		rare.start()
	} else if(command === 'coll'){
		collection.start()
	} else if(command === 'transfer'){
		transfer.start()
	} else if(command === 'smart'){
		smart.start()
	} else if(command === 'dump'){
		redis_handler.dump_queue(process.argv[3])
	} else if(command === 'len'){
		redis_handler.print_queue_length(process.argv[3])
		if(process.argv[3] === 'all') {
			let total_bids = 0
			let loops = 1
			while(true){
				await redis_handler.print_queue_length('high')
				await redis_handler.print_queue_length('rare')
				await redis_handler.print_queue_length('listed')
				await redis_handler.print_queue_length('transfer')
				await redis_handler.print_queue_length('staking')
				await redis_handler.print_queue_length('collection')
				await redis_handler.print_queue_length('flash')
				await redis_handler.print_queue_length('manual')
				let flash_length = await redis_handler.get_queue_length('flash')
				if(flash_length > 10000){
					redis_handler.dump_queue('flash')
				}
				console.log()
				let orders = await opensea_handler.get_orders_window('0x18a73AaEe970AF9A797D944A7B982502E1e71556', 3000)
				await utils.sleep(10000)
				let orders2 = await opensea_handler.get_orders_window('0x35C25Ff925A61399a3B69e8C95C9487A1d82E7DF', 3000)
				console.log((orders.length + orders2.length)*20 + ' bids per minute')
				total_bids += (orders.length + orders2.length)*20
				console.log('Average bpm: ' + (total_bids/loops).toFixed())
				if((orders.length + orders2.length) < 1){
					console.log('Queues are empty.')
				}
				if((orders.length + orders2.length)*20 < 1000 && (orders.length + orders2.length) < 0){
					console.log('Bidding is currently slow.')
				}
				console.log('----------------------')
				console.log()
				await utils.sleep(10000)
				loops += 1
			}
			process.exit(1)
		}
	} else if (command === 'focus') {
		focus.start();
	} else {
		console.log('Invalid command.')
	}
}
function run_flag(){
	console.log(process.argv)
	let queue = process.argv[2]
	let exp = process.argv[3]

	if(queue === 'smart'){
		smart.start()
	} else if(queue === 'flash'){
		if(exp === undefined){
			exp = ''
		}
		flash.get_competitor_bids(queue, exp)
	} else {
		console.log('Invalid command.')
	}
}
if (!myIp) {
	throw new Error(`cant get ip: "${myIp}"`);
}
async function main(){
	
	console.log(myIp)
	if(myIp === '10.0.0.59'){
		connect()
	}
	await redis_handler.start_connection()
	await mongo.connect()
	run_interactive()
	// if(!process.argv[2]){
	// 	run_interactive()
	// } else {
	// 	run_flag()
	// }
} 
main()
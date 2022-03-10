const manual = require('./queue/manual_queue.js')
const staking = require('./queue/staking_queue.js')
const rare = require('./queue/rare_queue.js')
const listed = require('./queue/listed_queue.js')
const flash = require('./queue/flash_queue.js')
const transfer = require('./queue/transfer_queue.js')
const smart = require('./queue/smart_queue.js')
const http = require('http')
const url = require('url');
const myIp  = require('./utility/what-is-my-ip.js');
const redis_handler = require('./handlers/redis_handler.js')
const mongo = require('./AssetsMongoHandler.js')
const utils = require('./utility/utils.js')

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
	} else if (req.url === '/collectionstats' && req.method === 'GET') {
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
async function run_interactive(){
const readline = require('readline-sync')	
	let command = readline.question('Run: ')
	if(command === 'comp'){
		let address = readline.question('address: ')
		let time_window = readline.question('window: ')
		let exp = readline.question('expire: ')
		manual.get_competitor(address, time_window*1000, exp)
		// add option for flat bid, and expiration
	} else if(command === 'man'){
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
		manual.manual_queue_add(slug, 'manual', exp/60, bid, run_traits)
		
	} else if(command === 'flash'){
		flash.start()
	} else if(command === 'staking'){
		staking.start()
	} else if(command === 'listed'){
		listed.start()
	} else if(command === 'rare'){
		rare.start_listener()
	} else if(command === 'transfer'){
		transfer.start()
	} else if(command === 'smart'){
		smart.start()
	} else if(command === 'dump'){
		let dump = readline.question('which: ')
		redis_handler.dump_queue(dump)
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

	if(!process.argv[2]){
		run_interactive()
	} else {
		run_flag()
	}
} 
main()
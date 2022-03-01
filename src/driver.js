const manual = require('./manual_queue.js')
const rare = require('./rare_queue.js')
const flash = require('./flash_queue.js')
const transfer = require('./transfer_queue.js')
const smart = require('./smart_queue.js')
const http = require('http')
const url = require('url');
const myIp  = require('./what-is-my-ip.js');
const redis_handler = require('./redis_handler.js')

const requestListener = function(req, res){
	    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Request-Method', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
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
						client.SET(key, r.floor);
					}
				} catch (ex) {
					console.log(ex);
				}
				res.end();
			}
		})
	} else if (urlParts.pathname === '/floor' && req.method === 'GET') {
		const collectionname = urlParts.query?.name;
		if (collectionname) {
			client.GET(`${collectionname}:floor`).then(x => res.end(x));
		} else {
			res.end('null');
		}
	} else if (urlParts.pathname === '/length' && req.method === 'GET') {
			redis_handler.get_queue_length('flash').then(x => res.end(x + '')).catch(_=>res.end('-1'));
	}
		else {
			res.end('bye you');
		}
}

if (!myIp) {
	throw new Error(`cant get ip: "${myIp}"`);
}
async function main(){
	const server = http.createServer(requestListener)
	server.listen(3000, myIp, () => {
		console.log('Server is running')
	})
	await redis_handler.start_connection()
	const readline = require('readline-sync')	
	let command = readline.question('Run: ')
	if(command === 'comp'){
		let address = readline.question('address: ')
		let time_window = readline.question('window: ')
		let exp = readline.question('expire: ')
		manual.get_competitor(address, time_window*1000, exp)
	} else if(command === 'slug'){
		let slug = readline.question('slug: ')
		manual.manual_queue_add(slug)
	} else if(command === 'flash'){
		flash.start()
	} else if(command === 'transfer'){
		transfer.start()
	} else if(command === 'rare'){
		rare.start_listener()
	} else if(command === 'smart'){
		smart.start()
	}	
} 
main()
const fs = require('fs')
const data_node = require('./data_node.js')
// const secret = require('./secret_node.js')
const opensea = require("opensea-js")
const Network = opensea.Network;
const RPCSubprovider = require("web3-provider-engine/subproviders/rpc");
const Web3ProviderEngine = require("web3-provider-engine");
const OpenSeaPort = opensea.OpenSeaPort;
const node_redis = require('redis')
const throttledQueue = require('throttled-queue');
const http = require('http')
const url = require('url');
const myIp  = require('./what-is-my-ip.js');

if (!myIp) {
	throw new Error(`cant get ip: "${myIp}"`);
}
console.log(myIp)

const client = node_redis.createClient({
	url: "redis://10.0.0.77:6379",
});
client.connect();
client.on('error', (err) => console.log('Redis Client Error', err));

var providerEngine = new Web3ProviderEngine();

var seaport = new OpenSeaPort(
  providerEngine,
  {
    networkName: Network.Main,
    apiKey: '9e72715b3e504813ac3ebc0512d473bf'
  },
  (arg) => console.log(arg)
);

providerEngine.start()

async function get_collection(slug){
	try{
		const collect = await seaport.api.get('/api/v1/collection/' + slug)
		return collect
	} catch (ex) {
		console.log("couldn't get floor")
	} 
}
async function getCollectionDetails(collectionName){
  try{
    const collect = await seaport.api.get('/api/v1/collection/' + collectionName)
	temp_collect = {}

	temp_collect[''] = collect['']


    return collect
  } catch (ex) {
    console.log("couldn't get collection")
  }  
}

async function sleep(ms){
	await new Promise(resolve => setTimeout(resolve, ms))
}
function get_ISOString(seconds){
	let search_time = Math.floor(+new Date()) - seconds
	return new Date(search_time).toISOString();
}
function get_ISOString_now(){
	let search_time = Math.floor(+new Date())
	return new Date(search_time).toISOString();
}

////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

const ETHERSCAN_API_KEY = 'AXQRW5QJJ5KW4KFAKC9UH85J9ZFDTB95KQ'

var block = 0;
var wallet_set = data_node.WATCH_LIST
var wallet_orders = [...(data_node.PRIORITY_COMP_WALLET), ...(data_node.COMP_WALLETS)]
var event_window = 15000

var staking_collections = [
	'0x12753244901f9e612a471c15c7e5336e813d2e0b', //sneaky vamps
	'0xdf8a88212ff229446e003f8f879e263d3616b57a', // sappy seals
	'0xab93f992d9737bd740113643e79fe9f8b6b34696', // metroverse
	'0xc3503192343eae4b435e4a1211c5d28bf6f6a696', // genesis creepz
	'0xed6552d7e16922982bf80cf43090d71bb4ec2179', // coolmonkes
	'0x000000000000000000000000000000000000dead', // anonymice
	'0x6714de8aa0db267552eb5421167f5d77f0c05c6d', // critterznft
]
let bids_added = 0
async function get_competitor_bids(){
	var start_time = Math.floor(+new Date())
  let search_time = get_ISOString(event_window)
  let search_time2 = get_ISOString_now()

  console.log('Adding to queue at: ' + search_time)
  
	let queue_length = await return_queue_length('flash')
	console.log('Queue size: ' + queue_length)
	console.log('bids added: ' + bids_added)
  bids_added = 0
  for(var wallet in wallet_orders){
  	var counter = 0
  	await sleep(500)
    var offset = 0
    do{
    	await sleep(250)
	    try{
		    const order = await seaport.api.getOrders({
		      side: 0,
		      order_by: 'created_date',
		      maker: wallet_orders[wallet],
		      listed_after: search_time,
		      listed_before: search_time2,
		      limit: 50,
		      offset: offset
		    })
		    try{
	        var username = order['orders'][0].makerAccount.user.username
	      } catch(ex){
	        username = 'Null'
	      }
	      // console.log(order.orders)
		    var order_length = order['orders'].length
		    for(let o of order.orders){
		    	let asset = {}
		    	asset['token_id'] = o.asset.tokenId
		    	asset['token_address'] = o.asset.tokenAddress
		    	asset['slug'] = o.asset.collection.slug
		    	asset['fee'] = o.asset.collection.devSellerFeeBasisPoints / 10000
		    	asset['event_type'] = 'flash'
		    	if(wallet_set.includes(asset['slug'])){
		    		counter += 1
		    		bids_added += 1
		    		if (data_node.PRIORITY_COMP_WALLET.includes(wallet_orders[wallet])) {
		    			asset['bid_amount'] = o.basePrice/1000000000000000000
		    			asset['event_type'] = 'high'
		    			push_asset_high_priority(asset);
		    		} else {
		    			redis_push_asset(asset)	
		    		}
		    	}
		    }
	    }
	    catch(ex) {
	    	order_length = 0
	      console.log(ex.message)
	      console.log('error with buy orders')
	    }
	    offset += 50
    } while(order_length === 50)
    console.log(counter + ' bids made by ' + username)
  }
  // console.log(start_time)
  var end_time = Math.floor(+new Date())
  // console.log(end_time)
  // console.log(end_time - start_time)
  // console.log(end_time - start_time < event_window)
  if (end_time - start_time < event_window){
  	let wait_time = event_window - (end_time - start_time)
  	console.log('waiting: ' + wait_time + 'ms')
  	await sleep(wait_time)
  }
  get_competitor_bids()
}


async function redis_push_asset(asset) {
	await client.rPush('queue:flash', JSON.stringify(asset));
}

async function push_asset_high_priority(asset) {
	await client.rPush('queue:high', JSON.stringify(asset));
}

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

		redis_queue_pop().then((val) => {
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
			return_queue_length('flash').then(x => res.end(x + '')).catch(_=>res.end('-1'));
	}
		else {
			res.end('bye you');
		}
}
async function dump_queue(queue_name){
	client.DEL('queue:' + queue_name)
	console.log(await client.LLEN("queue:" + queue_name))
}
async function get_queue_length(queue_name){
	console.log('Queue: ' + await client.LLEN("queue:" + queue_name))
}
async function return_queue_length(queue_name){
	return await client.LLEN("queue:" + queue_name)
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
async function flash_queue_start(){
	const server = http.createServer(requestListener)
	server.listen(3000, myIp, () => {
		console.log('Server is running')
	})
	dump_queue('flash')
	get_competitor_bids()
}

function main(){
	flash_queue_start()
}
main()

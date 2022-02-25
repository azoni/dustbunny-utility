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
const client = node_redis.createClient({
	url: "redis://10.0.0.77:6379",
});
client.connect();
client.on('error', (err) => console.log('Redis Client Error', err));
const ONE_SEC = 2000;
const floorThrottle = throttledQueue(2, ONE_SEC);

async function updateFloorDictionary() {
  return Promise.all(
    data_node.WATCH_LIST.map((curr_coll_name) =>
      floorThrottle(() => specialUpdateSingleFloor(curr_coll_name, 2))
    )
  );
}

let response_error_count = 0;
async function specialUpdateSingleFloor(collection, retry = 0) {
  response_error_count = Math.max(response_error_count - 1, 0);
  if (response_error_count >= 3) {
    await floorThrottle(() => specialUpdateSingleFloor(collection, retry));
  }
  let warningTimeout;
  try {
    let fiveSecCount = 0;
    const WARN_TIME = 5000;
    function hangingWarning() {
      console.log(`fetching ${collection} details taking too long. time so far: ${++fiveSecCount * WARN_TIME}ms`);
      warningTimeout = setTimeout(hangingWarning, WARN_TIME);
    }
    warningTimeout = setTimeout(hangingWarning, WARN_TIME);
    
    const collect = await seaport.api.get('/api/v1/collection/' + collection);
    clearTimeout(warningTimeout);
    const fetched_floor = collect['collection']['stats']['floor_price'];
    const dev_seller_fee_basis_points = collect['collection']['dev_seller_fee_basis_points']/10000;
    const token_address = collect['collection']['primary_asset_contracts'][0]['address']
    collection_json[collection] = {
      floor: fetched_floor, token_address, slug: collection, fee: dev_seller_fee_basis_points
    };
    console.log(`floor updated: ${collection}, floor: ${fetched_floor}, token_address: ${token_address}`);
  } catch (ex) {
    clearTimeout(warningTimeout);
    response_error_count++;
    console.error(ex, '\n', collection)
    if (retry > 0) {
      await floorThrottle(() => specialUpdateSingleFloor(collection, retry - 1))
    }
  }
}

// const MnemonicWalletSubprovider = require("@0x/subproviders")
// .MnemonicWalletSubprovider;
// const MNEMONIC = secret.MNEMONIC2
// const mnemonicWalletSubprovider = new MnemonicWalletSubprovider({
//   mnemonic: MNEMONIC,
// });
// var INFURA_KEY = 'deb8c4096c784171b97a21f7a5b7ba98'
// provider_string = "https://mainnet.infura.io/v3/" + INFURA_KEY
// var infuraRpcSubprovider = new RPCSubprovider({
// 	rpcUrl: provider_string//"https://mainnet.infura.io/v3/" + INFURA_KEY
//   });
var providerEngine = new Web3ProviderEngine();
// providerEngine.addProvider(mnemonicWalletSubprovider);
// providerEngine.addProvider(infuraRpcSubprovider);

var seaport = new OpenSeaPort(
  providerEngine,
  {
    networkName: Network.Main,
    apiKey: '9e72715b3e504813ac3ebc0512d473bf'
  },
  (arg) => console.log(arg)
);

providerEngine.start()
// function get_traits_floor(traits){
// 	for(asset in assets){
// 		if(asset){

// 		}
// 	}
// }

async function get_listed_asset(slug){
	var listed_assets = []
	var assets = await get_assets(slug)
	for(let asset of assets){
		if(asset.sellOrders !== null){
			listed_assets.push(asset)
		}
	}
	return listed_assets
}

async function get_collection(slug){
	try{
		const collect = await seaport.api.get('/api/v1/collection/' + slug)
		return collect
	} catch (ex) {
		console.log("couldn't get floor")
	} 
}
// async function get_token_address(){
// 	console.log('Building collection JSON started.')
// 	for(let slug of data_node.WATCH_LIST){
// 		await sleep(1000)
// 		let collection = await get_collection(slug)
// 		console.log(slug + ' ' + collection.collection.primary_asset_contracts[0].address)
// 		collection_json[slug] = collection.collection.primary_asset_contracts[0].address
// 	}
// 	console.log('Building collection JSON complete.')
// }


async function get_assets(slug){
	// if slug exists call from json
	// else opensea api call
	var offset = 0
	var limit = 50
	var assets_length = 0
	var assets_dict = {}
	var assets_list = []
	try {
		return require('./collections/' + slug + '.json').assets
	} catch(ex) {
		do {
			var assets = await seaport.api.getAssets({
				'collection': slug,
				'offset': offset,
				'limit': limit,
			})
			assets.assets.forEach((asset) =>{
				assets_list.push(asset)
			})
			assets_length = assets.assets.length
			offset += 50
			if(offset % 1000 === 0){
				console.log(offset)
			}
			
		} while(assets_length === 50)
	
		return assets_list
	}

}

// 
async function write_assets(slug, total_assets){
	// if slug exists call from json
	// else opensea api call
	var path = './collections/' + slug + '.json'
	var offset = 0
	var limit = 50
	var assets_length = 0
	var assets_dict = {}
	var assets_list = []
	var direction = 'asc'
	var temp_offset = 0
	var invalid = 0
	do {
		var assets = await seaport.api.getAssets({
			'collection': slug,
			'offset': offset,
			'limit': limit,
			'order_direction': direction
		})
		//Check for null. Ex. colection 10,000 assets, storing 10,050
		assets.assets.forEach((asset) =>{
			var trimmed_asset = {}
			trimmed_asset['tokenId'] = asset['tokenId']
			trimmed_asset['traits'] = asset['traits']
			trimmed_asset['name'] = asset['name']
			trimmed_asset['tokenAddress'] = asset['tokenAddress']
			trimmed_asset['imageUrl'] = asset['imageUrl']
			if(asset['imageUrl'] !== ''){
				assets_list.push(trimmed_asset)
			} else {
				console.log("Asset doesn't exist")
				invalid += 1
			}
			
		})
		assets_length = assets.assets.length
		//console.log(assets_list)
		offset += 50
		if(offset === 10000){
			temp_offset = 10000
			offset = 0
			direction = 'desc'
		}
		if(total_assets - temp_offset - offset < 50){
			limit = total_assets - offset - temp_offset
		}
		console.log(assets_list.length)
	} while(assets_list.length < total_assets - invalid)

	assets_dict['assets'] = assets_list
	console.log(assets_dict['assets'][total_assets - invalid - 1])
	const data = JSON.stringify(assets_dict);

	fs.writeFile(path, data, (err) => {
	    if (err) {
	        throw err;
	    }
	    console.log("JSON data is saved.");
	});
}

async function read_assets(slug){
	var path = './collections/' + slug + '.json'
	var asset_data = fs.readFileSync(path, "utf8")
	asset_data = JSON.parse(asset_data.toString())
	// console.log(asset_data)
	// console.log(asset_data.assets.length)
	return asset_data
}

//Asset object, BidAmount, Expiration
async function bid_asset_list(){

}
//TokenId, TokenAddress, BidAmount, Expiration
async function bid_single_collection(){

}
//dev_seller_fee_basis_points
//image_url
//stats
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
//order['orders'][o].taker !== '0x0000000000000000000000000000000000000000'
async function buy_order_by_collection(){
	try{   
		const order = await seaport.api.getOrders({
			side: 1,
			order_by: 'created_date',
			listed_after: search_time,
			listed_before: search_time2,
			limit: 50,
			offset: offset
		})
	} catch(ex){
		console.log(ex.message)
	}
}

async function fulfil_order(){
	var asset = await seaport.api.getAsset({
		'tokenAddress': '0x9508f760833b82cdfc030d66aa278c296e013f57',
		'tokenId': 1381,
	})
	let sell_order = asset.sellOrders[0]

	try{
		const transactionHash = await seaport.fulfillOrder({order: sell_order, 
			accountAddress:'0xcAe462347cd2d83f9A548AFAcb2CA6E0C6063BfF'})
		console.log(transactionHash)
	} catch(ex){
		console.log('catch')
		console.log(ex)
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
var event_window = 60000

async function getJSONFromFetch(f) {
  let r = await f;
  return r.json();
}

async function get_latest_block(){
	var current_time = Math.floor(+new Date()/1000)
	console.log('Getting lastest block...')
	const block_response = await fetch("https://api.etherscan.io/api?module=block&action=getblocknobytime&timestamp=" + current_time + "&closest=before&apikey=AXQRW5QJJ5KW4KFAKC9UH85J9ZFDTB95KQ");
	const block_data = await block_response.json()
	return block_data.result


	// const block_response2 =  await fetch("https://api.etherscan.io/api?module=proxy&action=eth_blockNumber&apikey=" + ETHERSCAN_API_KEY)
	// block = await block_response2.json()
	// console.log(block.result)
}
var staking_collections = [
	'0x12753244901f9e612a471c15c7e5336e813d2e0b', //sneaky vamps
	'0xdf8a88212ff229446e003f8f879e263d3616b57a', // sappy seals
	'0xab93f992d9737bd740113643e79fe9f8b6b34696', // metroverse
	'0xc3503192343eae4b435e4a1211c5d28bf6f6a696', // genesis creepz
	'0xed6552d7e16922982bf80cf43090d71bb4ec2179', // coolmonkes
	'0x000000000000000000000000000000000000dead', // anonymice
	'0x6714de8aa0db267552eb5421167f5d77f0c05c6d', // critterznft
]
async function get_etherscan_transactions(){
	let ourlatest = await get_latest_block()
	if(block === ourlatest){
		get_etherscan_transactions()
		return
	} else {
		block++;
	}	console.log('starting transactions')
	console.log('block: ' +  block)
	let tx_count = 0
	for(let collection in collection_json){
		const response = await fetch("https://api.etherscan.io/api?module=account&action=tokennfttx&contractaddress=" + collection_json[collection]['token_address'] + "&page=1&startblock=" + block + "&offset=100&sort=desc&apikey=" + ETHERSCAN_API_KEY);
		const data = await response.json()
		tx_count += data.result.length
		for(let tx of data.result){
			let event_type = 'transfer'
			if (tx.blockNumber > ourlatest) { ourlatest = tx.blockNumber; }
			if(staking_collections.includes(tx.from)){
				event_type = 'unstake'
			} else if (staking_collections.includes(tx.to)) {
				event_type = 'stake'
			}
			await get_nfts_from_wallet(tx.to, event_type)
			await get_nfts_from_wallet(tx.from, event_type)
		}
	}
	console.log('tx found: ' + tx_count)
	console.log('total nfts found: ' + running_nft_total)
	block = ourlatest;
	get_etherscan_transactions()

}
let running_nft_total = 0
async function get_nfts_from_wallet(interestAddress, event_type){
	if (staking_collections.includes(interestAddress)) {return; }
	// const interestAddress = "0xcae462347cd2d83f9a548afacb2ca6e0c6063bff";
	let f = fetch("https://api.etherscan.io/api?module=account&action=tokennfttx&address=" + interestAddress + "&startblock=0&endblock=999999999&sort=asc&apikey=" + ETHERSCAN_API_KEY)
	let myData = await getJSONFromFetch(f);

	// console.log(Object.keys(myData), myData.status, myData.message, myData.result?.length);

	let miniDb = {};

	//console.log(myData.result[0]);
	const allNftTX = myData.result || [];

	function upsertContract(contractAddress) {
	  if (!(contractAddress in miniDb)) {
	    miniDb[contractAddress] = {};
	  }
	}

	function upsertTokenId(contractAddress, tokenId) {
	  if (!(tokenId in miniDb[contractAddress])) {
	    miniDb[contractAddress][tokenId] = {};
	  }
	}

	for (const tx of allNftTX) {
	  upsertContract(tx.contractAddress);
	  upsertTokenId(tx.contractAddress, tx.tokenID);
	  if (tx.to === interestAddress) {
	    const lastTo = miniDb[tx.contractAddress][tx.tokenID].toTime || -1;
	    miniDb[tx.contractAddress][tx.tokenID].toTime = Math.max(tx.timeStamp, lastTo)
	  } else if (tx.from === interestAddress) {
	    const lastFrom = miniDb[tx.contractAddress][tx.tokenID].fromTime || -1;
	    miniDb[tx.contractAddress][tx.tokenID].fromTime = Math.max(tx.timeStamp, lastFrom);
	  } else {
	    console.error('error!!!');
	  }
	}
	let count = 0;
	let ownCount = 0;
	let countMap = {};
	for (const c in miniDb) {
	  for (const id in miniDb[c]) {
	    count++;
	    const boughtTime = miniDb[c][id].toTime || -Infinity;
	    const soldTime = miniDb[c][id].fromTime || -Infinity;
	    if (boughtTime > soldTime) {
	      if (!(c in countMap)) { countMap[c] = 0; }
	      countMap[c]++;
	      if(Object.values(collection_json).map(x=>x.token_address).includes(c)){
	      	// console.log(`${c} : { tokenid: ${id} }`);
	      	ownCount++
		    	let asset = {}
		    	asset['token_id'] = id
		    	asset['token_address'] = c
		    	asset['slug'] = token_address_dict[c]
		    	asset['fee'] = token_fee_dict[c]
		    	asset['event_type'] = event_type
    			push_asset_high_priority(asset);
	      }
	    }
	  }

	}
	console.log('owned by: ' + interestAddress)
	running_nft_total += ownCount
	// console.log(countMap);
	//console.log(`count: ${count}`);
	console.log(`total own: ${ownCount}`);
	get_queue_length('high')
	//console.log(miniDb);
	//console.log(Object.keys(miniDb))
	//console.log(Object.keys(miniDb).length);
}

async function get_competitor_bids(){
	var start_time = Math.floor(+new Date())

  let search_time = get_ISOString(event_window)
  let search_time2 = get_ISOString_now()

  console.log('Adding to queue at: ' + search_time)
  get_queue_length('flash')
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
		    	if(wallet_set.includes(asset['slug'])){
		    		counter += 1
		    		if (data_node.PRIORITY_COMP_WALLET.includes(wallet_orders[wallet])) {
		    			asset['current_bid'] = o.basePrice/1000000000000000000
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
  	console.log('waiting: ' + (end_time - start_time)/1000 + ' seconds')
  	await sleep((end_time - start_time))
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
			client.LLEN("queue:flash").then(x => res.end(x)).catch(_=>res.end(-1));
	}
		else {
			res.end('bye you');
		}
}
//172


async function dump_queue(queue_name){
	client.DEL('queue:' + queue_name)
	console.log(await client.LLEN("queue:" + queue_name))
}
async function get_queue_length(queue_name){
	console.log('Queue: ' + await client.LLEN("queue:" + queue_name))
}
//http method - client pull
async function redis_queue_pop(){
	let pop_count = 2
	let queue_data = await client.lPopCount('queue:high', pop_count)

	if(queue_data.length()){
		return queue_data
	} else {
		return await client.lPopCount('queue:flash', pop_count)
	}
}
let token_address_dict = {}
let token_fee_dict = {}
async function transfer_queue_start() {
	dump_queue('high')
	for(let collection in collection_json){
		// console.log(collection)
		token_address_dict[collection_json[collection]['token_address']] = collection
		token_fee_dict[collection_json[collection]['token_address']]= collection_json[collection]['fee']
	}
	// console.log(token_address_dict)
	// console.log(token_fee_dict)
	block = await get_latest_block();
	// await updateFloorDictionary()	
	// const data = JSON.stringify(collection_json);

	// fs.writeFile('./collections/collection_json.json', data, (err) => {
 //    if (err) {
 //        throw err;
 //    }
 //    console.log("JSON data is saved.");
	// });
	get_etherscan_transactions()
}
async function flash_queue_start(){
	const server = http.createServer(requestListener)
	server.listen(3000, '10.0.0.172', () => {
		console.log('Server is running')
	})
	get_competitor_bids()
	dump_queue('flash')
	// var slug = ['chain-runners-nft']
	// var assets = await get_assets('cool-cats-nft')
	// console.log(assets)
	// for(var index in slug){
	// 	var collect = await getCollectionDetails(slug[index])
	// 	await write_assets(slug[index], collect.collection.stats.total_supply)
	// }
	// var collect = await getCollectionDetails('alienfrensnft')
	// console.log(collect.collection.stats.count)
	// console.log(collect.collection.traits)
	// let list_assets = await get_listed_asset('alienfrensnft')
	// console.log(list_assets[0].traits)
}

function main(){
	flash_queue_start()
	// const readline = require('readline-sync')	
	// let start_function = readline.question('Which queue? ')
	// console.log('Starting' + start_function + 'queue...')
	// if(start_function === 'transfer'){
	// 	transfer_queue_start()
	// } else if (start_function === 'flash'){
	// 	flash_queue_start()
	// }
}
main()
// test_main()
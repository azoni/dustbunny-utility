const data_node = require('./data_node.js')
const node_redis = require('redis')
const collection_json = require('./collections/collection_json.json')
const url = require('url');
const fetch = require('node-fetch')
const client = node_redis.createClient({
	url: "redis://10.0.0.77:6379",
});
client.connect();
client.on('error', (err) => console.log('Redis Client Error', err));

var block = 0;
var wallet_set = data_node.WATCH_LIST
var wallet_orders = [...(data_node.PRIORITY_COMP_WALLET), ...(data_node.COMP_WALLETS)]
var event_window = 60000
let token_address_dict = {}
let token_fee_dict = {}
const ETHERSCAN_API_KEY = 'AXQRW5QJJ5KW4KFAKC9UH85J9ZFDTB95KQ'

const staking_collections = [
	'0x29205f257f9e3b78bcb27e253d0f3fad9d7522a2', //wolf game
	'0xd3a316d5fa3811553f67d9974e457c37d1c098b8', //wolf game
	'0x6ce31a42058f5496005b39272c21c576941dbfe9', // meta heroes
	'0x12753244901f9e612a471c15c7e5336e813d2e0b', //sneaky vamps
	'0xdf8a88212ff229446e003f8f879e263d3616b57a', // sappy seals
	'0xab93f992d9737bd740113643e79fe9f8b6b34696', // metroverse
	'0xc3503192343eae4b435e4a1211c5d28bf6f6a696', // genesis creepz
	'0xed6552d7e16922982bf80cf43090d71bb4ec2179', // coolmonkes
	'0x000000000000000000000000000000000000dead', // anonymice
	'0x6714de8aa0db267552eb5421167f5d77f0c05c6d', // critterznft
]

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

async function get_etherscan_transactions(){
	let ourlatest = await get_latest_block()
	if(block === ourlatest){
		get_etherscan_transactions()
		return
	} else {
		block++;
	}	console.log('starting transactions')
	console.log('block: ' +  block)
	let tx_count = 0;
	const walletsToBidOnDict = {};

	for(let collection in collection_json){
		const response = await fetch("https://api.etherscan.io/api?module=account&action=tokennfttx&contractaddress=" + collection_json[collection]['token_address'] + "&page=1&startblock=" + block + "&offset=100&sort=desc&apikey=" + ETHERSCAN_API_KEY);
		const data = await response.json()
		tx_count += data.result.length
		for (let tx of data.result) {
			let event_type = 'transfer'
			if (tx.blockNumber > ourlatest) { ourlatest = tx.blockNumber; }
			if(staking_collections.includes(tx.from)){
				event_type = 'unstake'
			} else if (staking_collections.includes(tx.to)) {
				event_type = 'stake'
			}
			walletsToBidOnDict[tx.to] = event_type;
			walletsToBidOnDict[tx.from] = event_type;
		}
		for (const address in walletsToBidOnDict) {
			const event_type = walletsToBidOnDict[address];
			await get_nfts_from_wallet(address, event_type);
		}
	}
	console.log('tx found: ' + tx_count)
	console.log('total nfts found: ' + running_nft_total)
	block = ourlatest;
	get_etherscan_transactions()

}

let running_nft_total = 0
async function get_nfts_from_wallet(interestAddress, event_type) {
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
async function main(){
	dump_queue('high')
	transfer_queue_start()
}
main()

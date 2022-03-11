const node_redis = require('redis');
const url = require('url');
const fetch = require('node-fetch');
const mongo = require('../AssetsMongoHandler.js')
const watchlistupdater = require('../utility/watchlist_retreiver.js');
const client = node_redis.createClient({
	url: "redis://10.0.0.80:6379",
});

let watch_list = undefined;

client.connect();
client.on('error', (err) => console.log('Redis Client Error', err));

/**
 * All the address seen in the last 30 minutes;
 */

let walletAddressSeenWithinXMins = {};
const LIMIT_30_MINS = 1_800_000;
let block = 0;

const ETHERSCAN_API_KEY = 'AXQRW5QJJ5KW4KFAKC9UH85J9ZFDTB95KQ'

/**
 * Every minute clean up the wallet address map
 * by removing all items older than 30 minutes.
 */
function cleanupWalletAddressMap() {
	console.log('clean up process');
	const t = Date.now();
	for (const key in walletAddressSeenWithinXMins){
		if (t - walletAddressSeenWithinXMins[key] >= LIMIT_30_MINS) {
			delete walletAddressSeenWithinXMins[key];
		}
	}
	setTimeout(cleanupWalletAddressMap, 60_000);
}



async function getJSONFromFetch(f) {
  let r = await f;
  return r.json();
}
async function get_latest_block(retry = 3){
	console.log('Getting lastest block...')
  try {
		const block_response = fetch("https://api.etherscan.io/api?module=proxy&action=eth_blockNumber&apikey=AXQRW5QJJ5KW4KFAKC9UH85J9ZFDTB95KQ");
		const block_data = await getJSONFromFetch(block_response);
		const blockNo = parseInt(block_data.result, 16);
		if (block_data['status'] === '0') {
			console.log(block_data);
			throw new Error('recieived error from latest block api')
		}
		console.log(blockNo);
		return blockNo;
	} catch (error) {
		console.warn('warning: retrying get latest block')
		console.warn(error);
		if (retry > 0) {
			await sleep(1_000);
			return get_latest_block(retry - 1);
		}
		throw new Error('Consistent error retrieving latest block.');
	}
}

async function getCollectionTransactions(collectionAddress, block, retry = 3) {
	if (!collectionAddress || !block) {
		throw new Error('invalid args to getCollectionTransactions');
	}
	try {
		const response = await fetch("https://api.etherscan.io/api?module=account&action=tokennfttx&contractaddress=" 
			+ collectionAddress
			+ "&page=1&startblock="
			+ block
			+ "&offset=100&sort=desc&apikey="
			+ ETHERSCAN_API_KEY);
		const data = await response.json()
		if (!Array.isArray(data['result'])) {
			console.log(block)
			console.log(collectionAddress)
			console.log(data);
			throw new Error('Error from collection transactions api');
		}
		return data;
	} catch (error) {
		console.warn(error)
		if (retry > 0) {
			await sleep(1_000);
			return getCollectionTransactions(collectionAddress, block, retry - 1);
		}
		throw new Error(error);
	}

}

async function get_etherscan_transactions(){
	let ourlatest = await get_latest_block()
	if(block === ourlatest){
		await sleep(125);
		get_etherscan_transactions()
		return
	} else {
		block++;
	}	console.log('starting transactions')
	console.log('block: ' +  block)
	let tx_count = 0;

	const walletAlreadyBidOnInThisLoop = new Set();
	let callTracer = 0;
	watch_list = watchlistupdater.getWatchList();
	for(let collection of watch_list) {
		callTracer = (callTracer + 1) % 10;
		if (!callTracer) { console.log('went through 10') }
		const walletsToBidOnDict = {};
		
		let data;

		try {
			data = await getCollectionTransactions(collection['address'], block);
		} catch (error) {
			console.warn(error);
			continue;
		}

		tx_count += data.result.length
		for (let tx of data.result) {
			let event_type = 'transfer'
			if (tx.blockNumber > ourlatest) { ourlatest = tx.blockNumber; }
			if(staking_collections.includes(tx.from)){
				event_type = 'unstake'
			} else if (staking_collections.includes(tx.to)) {
				event_type = 'stake'
			}
			if (tx.from === '0x0000000000000000000000000000000000000000') {
				event_type = 'mint'
			}

			if (!tx.to || !tx.from) {
				console.log('error')
				console.log(collection);
			} else {
				walletsToBidOnDict[tx.to] = event_type;
				walletsToBidOnDict[tx.from] = event_type;
			}
		}
		const timestamp = Date.now();

		for (const address in walletsToBidOnDict) {
			const event_type = walletsToBidOnDict[address];
			if (walletAlreadyBidOnInThisLoop.has(address)
				  || (address in walletAddressSeenWithinXMins
							&& timestamp - walletAddressSeenWithinXMins[address] < LIMIT_30_MINS)
			) {
					console.log('skipping some');
					continue;
			}
			walletAddressSeenWithinXMins[address] = timestamp;
			walletAlreadyBidOnInThisLoop.add(address);
			try {
				await get_nfts_from_wallet(address, event_type);
			} catch (error) {
				console.warn(error);
				console.warn(`strangely we failed to get nfts from address: ${address}`)
			}
		}
	}
	console.log('tx found: ' + tx_count)
	console.log('total nfts found: ' + running_nft_total)
	block = ourlatest;
	get_etherscan_transactions()
}

async function getNftTransactionsForAddress(address, retry = 3) {
	if (address === undefined) {
		throw new Error('invalid arg for getNftTransactionsForAddress');
	}
	try {
		let f = fetch("https://api.etherscan.io/api?module=account&action=tokennfttx&address=" + address + "&startblock=0&endblock=999999999&sort=asc&apikey=" + ETHERSCAN_API_KEY)
		let myData = await getJSONFromFetch(f);
		if (myData['status'] === "0") {
			throw new Error('Error from tokennfttx api');
		}
		return myData;
	} catch (error) {
		console.warn(error);
		if (retry > 0) {
			await sleep(1_000);
			return getNftTransactionsForAddress(address, retry - 1);
		}
		throw new Error('Consistent error from getNftTransactionsForAddress');
	}

}

let running_nft_total = 0
async function get_nfts_from_wallet(interestAddress, event_type) {
	console.log('get_nfts_from_wallet');
	if (staking_collections.includes(interestAddress)) {return; }
	// const interestAddress = "0xcae462347cd2d83f9a548afacb2ca6e0c6063bff";
	let myData = await getNftTransactionsForAddress(interestAddress);

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
	watch_list = watchlistupdater.getWatchList();
	for (const c in miniDb) {
	  for (const id in miniDb[c]) {
	    count++;
	    const boughtTime = miniDb[c][id].toTime || -Infinity;
	    const soldTime = miniDb[c][id].fromTime || -Infinity;
	    if (boughtTime > soldTime) {
	      if (!(c in countMap)) { countMap[c] = 0; }
	      countMap[c]++;
				const watchListCollection = watch_list.find(({address}) => address === c);
	      if (watchListCollection !== undefined) {
	      	// console.log(`${c} : { tokenid: ${id} }`);
	      	ownCount++
		    	let asset = {}
		    	asset['token_id'] = id
		    	asset['token_address'] = c
		    	asset['slug'] = watchListCollection['slug'];
		    	asset['event_type'] = event_type
					asset['tier'] = watchListCollection['tier'];
    			push_asset_high_priority(asset);
	      }
	    }
	  }

	}
	console.log('owned by: ' + interestAddress)
	running_nft_total += ownCount
	console.log(`total own: ${ownCount}`);
}

async function push_asset_high_priority(asset) {
	await client.rPush('queue:transfer', JSON.stringify(asset));
}
async function dump_queue(queue_name){
	client.DEL('queue:' + queue_name)
	console.log(await client.LLEN("queue:" + queue_name))
}
async function get_queue_length(queue_name){
	console.log('Queue: ' + await client.LLEN("queue:" + queue_name))
}
async function transfer_queue_start() {
	dump_queue('transfer')
	watch_list = watchlistupdater.getWatchList();
	block = await get_latest_block() - 1;
	get_etherscan_transactions()
}
let staking_collections;
async function start() {
	dump_queue('transfer')
	await watchlistupdater.startLoop();
	staking_collections = await mongo.readStakingWallets()
	staking_collections = staking_collections.map(el=>el.address)
	setTimeout(cleanupWalletAddressMap, LIMIT_30_MINS);
	transfer_queue_start()
}
async function sleep(ms){
	await new Promise(resolve => setTimeout(resolve, ms))
}
module.exports = {start}
// start()

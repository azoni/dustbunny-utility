const data_node = require('../data_node.js')
const values = require('../values.js')
// const secret = require('./secret_node.js')
const opensea = require("opensea-js")
const Network = opensea.Network;
const RPCSubprovider = require("web3-provider-engine/subproviders/rpc");
const Web3ProviderEngine = require("web3-provider-engine");
const OpenSeaPort = opensea.OpenSeaPort;
const throttledQueue = require('throttled-queue');
const http = require('http')
const url = require('url');


const providerEngine = new Web3ProviderEngine();
const seaport = new OpenSeaPort(
  providerEngine,
  {
    networkName: Network.Main,
    apiKey: values.API_KEY//'9e72715b3e504813ac3ebc0512d473bf'
  },
  (arg) => console.log(arg)
);


function start(){
	providerEngine.start()
}

async function get_assets_with_cursor(slug) {
	const limit = 50;
  let cursor = '';
	const result = [];
  do {
    let resourceUrl = createGetAssetURL({ slug, limit, cursor });
    console.log(resourceUrl);
    let response =  await fetchAssetPage(resourceUrl);
    cursor = response.cursor
    const assets = response.body?.assets || [];
    for (const asset of assets) {
      const  ass = {
        name: asset.name,
        token_id: asset.token_id,
        token_address: asset.asset_contract?.address,
        image_url: asset.image_url,
        slug: slug,
        dev_seller_fee_basis_points: parseInt(asset.collection?.dev_seller_fee_basis_points),
        traits: asset.traits || [],
				owner_address: asset?.owner?.address || '',
      };
			result.push(ass);
    }
    await sleep(500);
  } while (cursor);

	return result;
}

async function handleError(url, retry) {
  switch (retry) {
    case 3:
      return sleep(2000).then(_ => fetchAssetPage(url, retry - 1));
    case 2:
      return sleep(3000).then(_ => fetchAssetPage(url, retry - 1));
    case 1:
      return sleep(4000).then(_ => fetchAssetPage(url, retry - 1));
    default:
      return sleep(6000).then(_ => fetchAssetPage(url, retry - 1));
  }
}

async function fetchAssetPage(url, retry = 3) {
	const options = {method: 'GET', headers: {Accept: 'application/json', 'X-API-KEY': values.API_KEY}};
  return fetch(url, options)
  .then(response => {
    console.log(response.status);
    return response.json();
  })
  .then(response => {
    if (response.assets === undefined && retry > 0) {
      return handleError(url, retry);
    }
    console.log(`cursor: ${response.next}\nlen: ${response.assets?.length}\n`);
    return { cursor: response.next, len: response.assets?.length, body: response };
  })
  .catch(err => {
    console.error(err);
    if (retry > 0) {
      return handleError(url, retry);
    }
    return { cursor: undefined, len: 0 }
  });
}

function createGetAssetURL({ slug, limit = 50, cursor }) {
  let resourceUrl = 'https://api.opensea.io/api/v1/assets?' +
  `collection=${slug}` +
  `&order_by=pk` +
  (cursor ? `&cursor=${encodeURIComponent(cursor)}`: '' ) +
  //`&order_direction=${direction}` +
  `&limit=${limit}` +
  `&include_orders=false`
  return resourceUrl
}

// return all assets from collcetion
async function get_assets(slug){
	let offset = 0
	let limit = 50
	let assets_length = 0
	let assets_dict = {}
	let assets_list = []

	do {
		try{
			await sleep(250)
			let assets = await seaport.api.getAssets({
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
		} catch(e) {
			console.log(e.message)
		}
	
		if(offset > 10000){
			assets_length = 1
		}
	} while(assets_length === 50)

	return assets_list
	
}
// Return listed of assets listed for sale
async function get_listed_asset(slug){
	let listed_assets = []
	let assets = await get_assets(slug)
	for(let asset of assets){
		if(asset.sellOrders !== null){
			listed_assets.push(asset)
		}
	}
	return listed_assets
}

// Get assets by owner, or filter out all assets owned by an owner. Ex. Staking wallet.
async function get_asset_by_owner(slug, address, isOwned){
	let listed_assets = []
	let assets = await get_assets(slug)
	for(let asset of assets){
		if(asset.owner.address === address && isOwned){
			listed_assets.push(asset)
		} else if(asset.owner.address !== address && !isOwned){
			listed_assets.push(asset)
		}
	}
	return listed_assets
}
// return collection info
// floor, fee, volume, token addres, etc
async function get_collection(slug){
	try{
		const collect = await seaport.api.get('/api/v1/collection/' + slug)
		return collect
	} catch (ex) {
		console.log("couldn't get collection info")
	} 
}


async function get_listed_lowered(time_window){

}
//order['orders'][o].taker !== '0x0000000000000000000000000000000000000000'
async function get_orders_window(address, time_window, token_ids){
  let offset = 0
  let search_time = get_ISOString(time_window)
  let search_time2 = get_ISOString_now()
  let orders_array = []
  let order = 0
  let username = 'Null'
  var order_api_data = {
  	side: 0,
  	order_by: 'created_date',
  	listed_after: search_time,
		listed_before: search_time2,
		limit: 50,
    offset: offset
  }
  if(token_ids){
  	order_api_data['address'] = address
  	order_api_data['token_ids'] = token_ids
  } else if(address !== 'all'){
  	order_api_data['maker'] = address
  }
  
  do{
  	await sleep(250)
    try{
    		order = await seaport.api.getOrders(order_api_data)	    
	    try{
        username = order['orders'][0].makerAccount.user.username
      } catch(ex){

      }
	    var order_length = order['orders'].length
	    for(let o of order.orders){
	    	orders_array.push(o)
	    }
    }
    catch(ex) {
    	order_length = 0
      console.log(ex.message)
      console.log('----error with buy orders')
    }
    offset += 50
  } while(order_length === 50)
  console.log(orders_array.length + ' bids made by ' + username)
  return orders_array
}

// buy nft with ETH - example code
async function fulfil_order(){
	let asset = await seaport.api.getAsset({
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

module.exports = {
	start,
	seaport,
	get_collection,
	get_assets,
	get_orders_window,
	get_assets_with_cursor
};

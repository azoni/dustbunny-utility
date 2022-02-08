const fs = require('fs')
const secret = require('./secret_node.js')
const opensea = require("opensea-js")
const Network = opensea.Network;
const RPCSubprovider = require("web3-provider-engine/subproviders/rpc");
const Web3ProviderEngine = require("web3-provider-engine");
const OpenSeaPort = opensea.OpenSeaPort;
const MnemonicWalletSubprovider = require("@0x/subproviders")
.MnemonicWalletSubprovider;
const MNEMONIC = secret.MNEMONIC2
const mnemonicWalletSubprovider = new MnemonicWalletSubprovider({
  mnemonic: MNEMONIC,
});
var INFURA_KEY = 'deb8c4096c784171b97a21f7a5b7ba98'
provider_string = "https://mainnet.infura.io/v3/" + INFURA_KEY
var infuraRpcSubprovider = new RPCSubprovider({
	rpcUrl: provider_string//"https://mainnet.infura.io/v3/" + INFURA_KEY
  });
var providerEngine = new Web3ProviderEngine();
providerEngine.addProvider(mnemonicWalletSubprovider);
providerEngine.addProvider(infuraRpcSubprovider);

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

// async function get_listed_asset(slug){
// 	var listed_assets = []
// 	var assets = await get_assets(slug)
// 	console.log(assets)

// 	for(asset in assets){
// 		if(assets[asset].sellOrders !== null){

// 		}
// 	}

// 	return listed_assets
// }

async function get_collection(slug){
	try{
		const collect = await seaport.api.get('/api/v1/collection/' + slug)
		return collect
	} catch (ex) {
		console.log("couldn't get floor")
	} 
}
async function get_assets(slug){
	// if slug exists call from json
	// else opensea api call
	var offset = 0
	var limit = 50
	var assets_length = 0
	var assets_dict = {}
	var assets_list = []

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
		console.log(offset)
	} while(assets_length === 50)

	return assets_list
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

async function main(){
	// var slug = ['creatureworld']
	// //var assets = await get_assets('cool-cats-nft')
	// //console.log(assets)
	// //write_assets('lazy-lions', 10080)
	// for(var index in slug){
	// 	var collect = await getCollectionDetails(slug[index])
	// 	await write_assets(slug[index], collect.collection.stats.total_supply)
	// }
}

main()

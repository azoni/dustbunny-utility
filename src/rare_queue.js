//grab rares from data and throw into priority high queue if a bid is detected
const data_node = require('./data_node.js')
const opensea_handler = require('./opensea_handler.js')
const utils = require('./utils.js')


//getOrders on 30 token IDs at once, possibly match expiration
async function start_listener(){
	var exp = .33
	let asset_contract_address = '0x8a90cab2b38dba80c64b7734e58ee1db38b8992e'
	let token_ids = [[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,28,29,18,19,20,21,22,23,24,25,26,27,30],[31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60]]
	var start_time = Math.floor(+new Date())
	for(let token_array of token_ids){
		await utils.sleep(500)
		var orders =  await opensea_handler.get_orders_window(asset_contract_address, 20000, token_array)
		console.log('Getting orders for ' + asset_contract_address + '...')
	    for(let o of orders){
	    	let asset = {}
	    	try{
		        var username = o.makerAccount.user.username
		      } catch(ex){
		        username = 'Null'
		      }
	    	asset['token_id'] = o.asset.tokenId
	    	asset['token_address'] = o.asset.tokenAddress
	    	asset['slug'] = o.asset.collection.slug
	    	asset['fee'] = o.asset.collection.devSellerFeeBasisPoints / 10000
	    	asset['event_type'] = 'competitor ' + username
	    	asset['expiration'] = false
	    	if(exp !== ''){
	    		asset['expiration'] = exp/60
	    	}
	    	asset['bid_multi'] = false
	    	asset['bid_amount'] = o.basePrice/1000000000000000000
			console.log(asset)
	    }
	}
    var end_time = Math.floor(+new Date())
	if (end_time - start_time < 20000){
		let wait_time = 20000 - (end_time - start_time)
		console.log('waiting: ' + wait_time + 'ms')
		await utils.sleep(wait_time)
	}
	start_listener()
}
// start_listener()
module.exports = { start_listener};
const fs = require('fs')
const data_node = require('./data_node.js')
const redis_handler = require('./redis_handler.js')

var wallet_set = data_node.WATCH_LIST
var wallet_orders = [...(data_node.PRIORITY_COMP_WALLET), ...(data_node.COMP_WALLETS)]
var time_window = 15000

let bids_added = 0
async function get_competitor_bids(exp){
	var start_time = Math.floor(+new Date())
  let search_time = get_ISOString(time_window)
  let search_time2 = get_ISOString_now()

  console.log('Adding to queue...')
  
	let queue_length = await return_queue_length('flash')
	console.log('Queue size: ' + queue_length)
	console.log('bids added: ' + bids_added)
  bids_added = 0
  for(var address of wallet_orders){
  	await utils.sleep(500)
  	var orders =  await opensea_handler.get_orders_window(address, time_window)
    try {
	    try{
        var username = order['orders'][0].makerAccount.user.username
      } catch(ex){
        username = 'Null'
      }
	    for(let o of orders){
	    	let asset = {}
	    	asset['token_id'] = o.asset.tokenId
	    	asset['token_address'] = o.asset.tokenAddress
	    	asset['slug'] = o.asset.collection.slug
	    	asset['fee'] = o.asset.collection.devSellerFeeBasisPoints / 10000
	    	asset['event_type'] = 'flash'
	    	asset['expiration'] = false
	    	if(exp !== ''){
	    		asset['expiration'] = exp/60
	    	}
	    	if(wallet_set.includes(asset['slug'])){
	    		counter += 1
	    		bids_added += 1
	    		if (data_node.PRIORITY_COMP_WALLET.includes(wallet_orders[wallet])) {
	    			asset['bid_amount'] = o.basePrice/1000000000000000000
	    			asset['event_type'] = 'high ' + username
	    			redis_handler.push_asset_high_priority(asset);
	    		} else {
	    			redis_handler.redis_push_asset_flash(asset);
	    		}
	    	}
	    }
    }
    catch(ex) {
      console.log(ex.message)
      console.log('error flash queue')
    }
	  console.log(counter + ' bids made by ' + username)
	}
	var end_time = Math.floor(+new Date())
	if (end_time - start_time < time_window){
		let wait_time = time_window - (end_time - start_time)
		console.log('waiting: ' + wait_time + 'ms')
		await utils.sleep(wait_time)
	}
  get_competitor_bids()
}

async function flash_queue_start(){
	dump_queue('flash')
	const readline = require('readline-sync')	
	let exp = readline.question('exp: ')
	if(exp === ''){
		exp = false
	}
	get_competitor_bids(exp)
}

function start(){
	flash_queue_start()
}
// start()
module.exports = { start };
const fs = require('fs')
const data_node = require('./data_node.js')
const redis_handler = require('./redis_handler.js')
const utils = require('./utils.js')
const opensea_handler = require('./opensea_handler.js')
const rare = require('./rare_queue.js')

var wallet_set = data_node.WATCH_LIST


let bids_added = 0
let counter = 0
var wallet_orders = data_node.COMP_WALLETS

async function get_competitor_bids(type, exp){
 	var time_window = wallet_orders.length * 2000
 	let start_time = Math.floor(+new Date())
  let search_time = utils.get_ISOString(time_window)
  let search_time2 = utils.get_ISOString_now()
  console.log('Adding to queue...' + ' event widnow: ' + time_window)
  
	let queue_length = await redis_handler.get_queue_length(type)
	
	console.log('bids added: ' + bids_added)
  bids_added = 0
  for(var address of wallet_orders){
  	await utils.sleep(250)
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
	    	asset['event_type'] = type 
	    	asset['expiration'] = false
	    	if(exp !== ''){
	    		asset['expiration'] = exp/60
	    	}
	    	if(wallet_set.includes(asset['slug'])){
	    		counter += 1
	    		bids_added += 1
	    		if (data_node.PRIORITY_COMP_WALLET.includes(wallet_orders[address])) {
	    			asset['bid_amount'] = o.basePrice/1000000000000000000
	    			redis_handler.push_asset_high_priority(asset);
	    		} else {
	    			if(queue_length < 1000){
	    				asset['bid_amount'] = o.basePrice/1000000000000000000
	    			}
	    			redis_handler.redis_push_asset_flash(asset);
	    		}
	    	}
	    }
    }
    catch(ex) {
    	console.log(ex)
      console.log(ex.message)
      console.log('error ' + type + ' queue')
    }
	  // console.log(counter + ' bids made by ' + username)
	}
	var end_time = Math.floor(+new Date())
	if (end_time - start_time < time_window){
		let wait_time = time_window - (end_time - start_time)
		console.log('Queue ' + type + ': ' + queue_length)
		console.log('waiting: ' + wait_time + 'ms')
		await utils.sleep(wait_time)
	}
  get_competitor_bids(type, exp)
}

async function flash_queue_start(){
	redis_handler.dump_queue('flash')
	const readline = require('readline-sync')	
	let exp = readline.question('exp: ')
	if(exp === ''){
		exp = false
	}
	let type = readline.question('flash or high1, high2: ')
 	if(type === 'high1' || type === 'high2'){
 		if(type === 'high1'){
 			wallet_orders = data_node.PRIORITY_COMP_WALLET1
 		} else if(type === 'high2'){
 			wallet_orders = data_node.PRIORITY_COMP_WALLET2
 		}
 		type = 'high'
 	}
	get_competitor_bids(type, exp)
}

function start(){
	flash_queue_start()
}
// start()
module.exports = { start };
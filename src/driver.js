const manual = require('./manual_queue.js')
const rare = require('./rare_queue.js')
const flash = require('./flash_queue.js')
const transfer = require('./transfer_queue.js')
const smart = require('./smart_queue.js')

async function main(){
	const readline = require('readline-sync')	
	let command = readline.question('Run: ')
	if(command === 'comp'){
		let address = readline.question('address: ')
		let time_window = readline.question('window: ')
		let exp = readline.question('expire: ')
		manual.get_competitor(address, time_window*1000, exp)
	} else if(command === 'manual'){
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
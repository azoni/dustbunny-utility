const API_KEY = 'AXQRW5QJJ5KW4KFAKC9UH85J9ZFDTB95KQ'
const ETHERSCAN_API_KEY2 = 'AXQRW5QJJ5KW4KFAKC9UH85J9ZFDTB95KQ'

// var staking_collections = [
// 	'0x12753244901f9e612a471c15c7e5336e813d2e0b', //sneaky vamps
// 	'0xdf8a88212ff229446e003f8f879e263d3616b57a', // sappy seals
// 	'0xab93f992d9737bd740113643e79fe9f8b6b34696', // metroverse
// 	'0xc3503192343eae4b435e4a1211c5d28bf6f6a696', // genesis creepz
// 	'0xed6552d7e16922982bf80cf43090d71bb4ec2179', // coolmonkes
// 	'0x000000000000000000000000000000000000dead', // anonymice
// 	'0x6714de8aa0db267552eb5421167f5d77f0c05c6d', // critterznft
// ]

async function get_eth_balance(address){
	try {
		const response = await fetch('https://api.etherscan.io/api?module=account&action=balance&address=' + address + '&tag=latest&apikey=' + API_KEY);
		const data = await response.json()

		return parseFloat(data.result/1000000000000000000)
	} catch (error) {
	  console.log('Looks like there was a problem: ', error);
	}
}

async function get_weth_balance(address){
	try {
		const response = await fetch('https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2&address=' + address + '&tag=latest&apikey=' + API_KEY)
		const data = await response.json()
		return parseFloat(data.result/1000000000000000000)
	} catch (error) {
	  console.log('Looks like there was a problem: ', error);
	}	
}

module.exports = { get_eth_balance, get_weth_balance };
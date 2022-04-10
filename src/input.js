const mongo_handler = require('./handlers/mongo_handler.js')
const redis_handler = require('./handlers/redis_handler.js')
const opensea_handler = require('./handlers/opensea_handler.js')

async function get_watch_list() {
	const watch_list = await mongo_handler.readWatchList()
	let counter = 0
	const skip_list = ['skip']
	for (const collection of watch_list) {
		const collection_stats = await redis_handler.client.GET(`${collection.slug}:stats`)
		const data = JSON.parse(collection_stats)
		const { floor_price } = data
		const { fee } = data
		if (!skip_list.includes(collection.tier) && floor_price > .5) {
			counter += 1
			console.log(collection.slug)
		}
	}
	console.log(`Count: ${counter}`)
}

// trait floors, erc20 tokens
async function main() {
	await mongo_handler.connect()
	await redis_handler.client.connect()
	if (process.argv[2] === 'watch-list') {
		await get_watch_list()
	}
	let total_profit = 0
	const wallets = ['0xf339dB5EF836A1bbD0A9F8E102f82e9f4dA8C8CA', '0xb56851362dE0f360E91e5F52eC64d0A1D52E98E6']
	for (const wallet of wallets) {
		const assets = await opensea_handler.get_assets_from_wallet(wallet)
		for (const asset in assets) {
			let asset_profit = 0
			const collection_stats = await redis_handler.client.GET(`${asset}:stats`)
			const data = JSON.parse(collection_stats)
			if(!data) {
				continue
			}
			const after_fees = data.floor_price - data.floor_price * (data.dev_seller_fee_basis_points/10000 + .025)
			console.log(`Count: ${assets[asset].length} Slug: ${asset} Floor: ${data.floor_price} Fee: ${data.dev_seller_fee_basis_points/100}% = ${after_fees.toFixed(2)}`)
			for (const id of assets[asset]) {
				id['profit'] = (after_fees - id['purchased'])
				asset_profit += id['profit']
				id['profit'] = (after_fees - id['purchased']).toFixed(2)
				delete id['slug']
			}
			console.log(assets[asset])
			console.log(`${asset} profit: ${asset_profit.toFixed(2)}`)	
			total_profit += asset_profit
		}
	}
	console.log(`Total profit: ${total_profit.toFixed(2)}`)
}

main()

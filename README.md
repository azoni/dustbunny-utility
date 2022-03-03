# Getting Started Dustbunny

OpenSea Handler
get_assets(slug) - get assets
get_listed_assets(slug) - return list of assets listed for sale
get_asset_by_owner(slug, address, isOwned) - return list of assets by owner or owner filtered out
get_collection(slug) - return collection data
get_listed_lowered(time_window) - get all listed or lowered events by time.
get_orders_window(address, time_window, token_ids) - Get bids by time, options include, bids from specific wallet, bids on specific assets, and all bids.

Etherscan Handler
get_eth_balance(address) - return eth balance by address
get_weth_balance(address) - return weth balance by address

Redis Queue Handler
start_connection() - start redis connection
dump_queue(queue_name) - dump specific queue
print_queue_length(queue_name) - console.log queue length
get_queue_length(queue_name) - return queue length
redis_push(queue_name) - push to specific redis queue
redis_queue_pop() - http meethod for client pull

MongoDB Handler


Utilitiy Handler
sleep(ms) - await x seconds
start_timer() - start a timer
end_timer() - end timer
get_ISOString(seconds) - convert current - seconds Math.floor(+new Date()) to ISO 
get_ISOString_now() - convert current Math.floor(+new Date()) to ISO 

Queue priority order - high, rare, transfer, manual, staking, smart, flash

Manual Queue
Add collections manually to the 'manual' queue
Add single competitor manually to 'manual' queue 
Used in other queues for adding whole collections

Flash Queue
Bully bot, competitors upbid. upbid specific competitors and push to specific queues. Certain competitors will be added to 'high' queue

Rare Queue
Handle bid events on specific NFTs of interest. Essentially adds a listener to rare NFTS. Can include up to 30 assets from the same collection per getOrders() call. Add to 'rare' queue.

Smart Queue
Add to 'smart' queue based on number of bids on a collection. Will add the collections with least amount of bids at the time. Takes weth_balance into account and picks collections within your price range. 

Transfer Queue
Add assets to 'transfer' queue based on etherscan activity. When address transfers or accepts an offer bid on all nfts of interest in both wallets. Skip staking wallets.

Staking Queue
Continue to run through NFT collections with staking since the weth requirement is much lower from most the collection being 'staked'. Add assets to 'staking' queue often. 

Asset object construction - All queues must contain assets in this format.

asset['token_id'] = o.asset.tokenId

asset['token_address'] = o.asset.tokenAddress

asset['slug'] = o.asset.collection.slug

asset['fee'] = o.asset.collection.devSellerFeeBasisPoints / 10000

asset['event_type'] = 'manual competitor'

asset['expiration'] = false

asset['range'] = [0.8,0.9]

asset['bid_amount'] = o.basePrice/1000000000000000000

asset['trait'] = false
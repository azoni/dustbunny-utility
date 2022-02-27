# Getting Started Dustbunny

OpenSea
Etherscan
Redis Queue
MongoDB

manual_queue.js


Manually add collection to queue

Manually add competitor wallet and time frame to upbid all bids made

asset['token_id'] = o.asset.tokenId

asset['token_address'] = o.asset.tokenAddress

asset['slug'] = o.asset.collection.slug

asset['fee'] = o.asset.collection.devSellerFeeBasisPoints / 10000

asset['event_type'] = 'manual competitor'

asset['expiration'] = false

asset['bid_multi'] = false

asset['bid_amount'] = o.basePrice/1000000000000000000
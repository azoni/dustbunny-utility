const Stream = require('@opensea/stream-js')

const { OpenSeaStreamClient } = Stream

const { WebSocket } = require('ws')
const mongo_handler = require('./handlers/mongo_handler.js')
const redis_handler = require('./handlers/redis_handler.js')

const values = require('./values.js')

let watch_list

const client = new OpenSeaStreamClient({
  token: values.API_KEY,
  connectOptions: {
    transport: WebSocket,
  },
})
async function create_watch_list() {
  await mongo_handler.connect()
  await redis_handler.start_connection()
  watch_list = await mongo_handler.readWatchList()
  watch_list = watch_list.map(({ slug }) => slug)
}

client.onItemListed('*', (event) => {
  if (watch_list.includes(event.payload.collection.slug)) {
    const nft_id = event.payload.item.nft_id.split('/')
    const asset = {
      token_id: nft_id[2],
      token_address: nft_id[1],
      slug: event.payload.collection.slug,
      expiration: 0.25,
      event_type: 'listed',
      bidding_adress: '0xd517e2ACDFBBb19BcC3c7069dDDeE2D67Eab4E6c',
    }
    redis_handler.redis_push('listed', asset);
  }
})

create_watch_list()

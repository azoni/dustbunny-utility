const Stream = require('@opensea/stream-js')

const { OpenSeaStreamClient } = Stream

const { WebSocket } = require('ws')
const values = require('./values.js')

const client = new OpenSeaStreamClient({
  token: values.API_KEY,
  connectOptions: {
    transport: WebSocket,
  },
})

client.onItemListed('cool-cats-nft', (event) => {
  console.log(event)
})

client.onItemListed('doodles-official', (event) => {
  console.log(event)
})

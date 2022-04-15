const opensea_handler = require('../handlers/opensea_handler.js')
const redis_handler = require('../handlers/redis_handler.js')

async function start() {
  while(true) {
    const order = await redis_handler.client.lPopCount('queue:orders', 1)
    const asset = {}
    
    await redis_handler.redis_push(order.event_type, asset)
  }
}

module.exports = { start }

console.log('here1')
// eslint-disable-next-line import/no-extraneous-dependencies
const redis_handler = require('../handlers/redis_handler.js');
const opensea_handler = require('../handlers/opensea_handler.js');
console.log('here2')
const { seaport } = opensea_handler;

let try_to_buy_timeout;

async function try_to_buy() {
  let data;
  try {
    data = await redis_handler.redis_pop_listing_to_purchase();
  } catch (error) {
    data = undefined;
    console.error(error.stack);
  }
  let listing;
  try {
    // console.log(data)
    listing = JSON.parse(data);
  } catch (error) {
    console.error(error.stack);
  }
  if (listing) {
    console.log(JSON.stringify(listing, null, 2));
    try {
      const transactionHash = await seaport.fulfillOrder({
        order: listing,
        accountAddress: '0x763be576919a0d32b9e7ebDaF5a858195E04A6Cb',
      });
      console.log(`Hash: ${transactionHash}`);
    } catch (error) {
      console.error(error.stack);
    }
  }
  clearTimeout(try_to_buy_timeout);
  try_to_buy_timeout = setTimeout(try_to_buy, 500);
}

async function start_buying_loop() {
  try_to_buy();
}

async function start() {
  await opensea_handler.start();
  start_buying_loop()
}

module.exports = { start }

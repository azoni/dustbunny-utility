// eslint-disable-next-line no-unused-vars
const opensea_handler = require('../handlers/opensea_handler.js')
const redis_handler = require('../handlers/redis_handler.js')
const utils = require('../utility/utils.js')
const mongo = require('../AssetsMongoHandler.js')
const mongo_handler = require('../handlers/mongo_handler.js')

async function staking_queue_add(slug, exp) {
  await mongo_handler.connect()
  console.log(`Getting unstaked assets for ${slug}...`)
  const assets = await opensea_handler.get_assets_with_cursor(slug)
  // const assets = await mongo.find({ slug }, {})
  const staking_wallets = await mongo.readStakingWallets()
  const slugs_staking_wallets = staking_wallets
    .map(({ address }) => address.toLowerCase());

  let counter = 0
  for (const asset of assets) {
    asset.fee = asset.dev_seller_fee_basis_points / 10000
    asset.event_type = 'staking'
    asset.expiration = exp
    if (asset.owner_address === null || asset.owner_address === undefined) {
      console.log(asset.token_id)
      // eslint-disable-next-line no-continue
      continue
    }
    // owner_address if from opensea.
    await mongo_handler.update_owner_asset(asset.slug, asset.token_id, asset.owner_address)
    // // eslint-disable-next-line no-continue
    // continue
    if (slugs_staking_wallets.includes(asset.owner_address.toLowerCase()) || !asset.owner_address) {
      // eslint-disable-next-line no-continue
      continue
    }
    counter += 1
    asset.bid_amount = false
    // await redis_handler.redis_push('staking', asset)
  }
  console.log(`counter: ${counter}`)
  // await redis_handler.print_queue_length('staking')
  console.log(`${slug} added.`)
}

async function start() {
  const exp = 15
  await staking_queue_add('thehabibiz', exp / 60)
  await staking_queue_add('lootrealms', exp / 60)
  await staking_queue_add('llamaverse-genesis', exp / 60)
  await staking_queue_add('raidparty', exp / 60)
  await staking_queue_add('raidpartyfighters', exp / 60)
  await staking_queue_add('critterznft', exp / 60)
  await staking_queue_add('sappy-seals', exp / 60)
  await staking_queue_add('anonymice', exp / 60)
  await staking_queue_add('genesis-creepz', exp / 60)
  await staking_queue_add('metahero-generative', exp / 60)
  await staking_queue_add('metroverse-genesis', exp / 60)
  await staking_queue_add('metroverse-blackout', exp / 60)
  await staking_queue_add('ether-orcs', exp / 60)
  await staking_queue_add('nft-worlds', exp / 60)
}

module.exports = { start, staking_queue_add };

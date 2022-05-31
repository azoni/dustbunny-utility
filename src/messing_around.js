/* eslint-disable max-len */
const Stream = require('@opensea/stream-js')

const { OpenSeaStreamClient, EventType } = Stream

const { WebSocket } = require('ws')
const mongo_handler = require('./handlers/mongo_handler.js')
const redis_handler = require('./handlers/redis_handler.js')
const opensea_handler = require('./handlers/opensea_handler.js')

const values = require('./values.js')

let watch_list
const focus_list = ['boredapeyachtclub', 'bored-ape-kennel-club', 'doodles-official', 'mutant-ape-yacht-club', 'azuki', 'cloneX']

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
async function get_assets_from_wallet(wallet) {
  const assets = await opensea_handler.get_assets_from_wallet(wallet)
  return assets
}
async function push_transfer_to_focus(from, to) {
  const staking_wallets = await mongo_handler.readStakingWallets()
  const slugs_staking_wallets = staking_wallets.map(({ address }) => address.toLowerCase())

  if (!slugs_staking_wallets.includes(from)) {
    const assets_from = await get_assets_from_wallet(from)
    console.log(`${from}`)
    for (const asset in assets_from) {
      for (const id of assets_from[asset]) {
        if (watch_list.includes(id.slug)) {
          let time = 15
          let which_queue = 'transfer'
          if (focus_list.includes(id.slug)) {
            time = 30
            which_queue = 'high-focus'
          }
          const command = {
            hash: `${id.slug}:${id.token_id}`,
            slug: id.slug,
            collection_address: id.token_address,
            token_ids: [id.token_id],
            time_suggestion: time * 60_000,
          }
          console.log(`TRANSFER ADDED (FROM)- ${id.slug} ${id.token_id}`)
          redis_handler.redis_push_command(command, which_queue)
        }
      }
    }
  }
  if (!slugs_staking_wallets.includes(to)) {
    const assets_to = await get_assets_from_wallet(to)
    console.log(`${to}`)
    for (const asset in assets_to) {
      for (const id of assets_to[asset]) {
        if (watch_list.includes(id.slug)) {
          let time = 15
          let which_queue = 'transfer'
          if (focus_list.includes(id.slug)) {
            time = 30
            which_queue = 'high-focus'
          }
          const command = {
            hash: `${id.slug}:${id.token_id}`,
            slug: id.slug,
            collection_address: id.token_address,
            token_ids: [id.token_id],
            time_suggestion: time * 60_000,
          }
          console.log(`TRANSFER ADDED (TO)- ${id.slug} ${id.token_id}`)
          redis_handler.redis_push_command(command, which_queue)
        }
      }
    }
  }
}
client.onEvents('*', [EventType.ITEM_SOLD, EventType.ITEM_TRANSFERRED], (event) => {
  try {
    if (watch_list.includes(event.payload.collection.slug)) {
      const nft_id = event.payload.item.nft_id.split('/')
      if (event.event_type === 'item_transferred') {
        console.log('----------TRANSFER----------')
        console.log(`${event.event_type} ${event.payload.collection.slug} ${nft_id[2]}`)
        push_transfer_to_focus(event.payload.from_account.address, event.payload.to_account.address)
      } else {
        console.log(`ITEM SOLD - ${event.payload.collection.slug} ${nft_id[2]}`)
      }
    }
  } catch (e) {
    console.log(e)
  }
});
client.onItemListed('*', (event) => {
  try {
    if (watch_list.includes(event.payload.collection.slug)) {
      const nft_id = event.payload.item.nft_id.split('/')
      const asset = {
        token_id: nft_id[2],
        token_address: nft_id[1],
        slug: event.payload.collection.slug,
        expiration: 0.25,
        event_type: 'listed',
        base_price: event.payload.base_price / 1000000000000000000,
      }
      let time = 360
      let which_queue = 'listed'
      if (focus_list.includes(asset.slug)) {
        which_queue = 'high-focus'
        time = 360
      }
      const command = {
        hash: `${asset.slug}:${asset.token_id}`,
        slug: asset.slug,
        collection_address: asset.token_address,
        token_ids: [asset.token_id],
        time_suggestion: time * 60_000,
      }
      console.log(`LISTING ADDED - ${asset.slug} ${asset.token_id} ${asset.base_price}`)
      redis_handler.redis_push_command(command, which_queue)
    }
  } catch (e) {
    console.log(e)
  }
})

create_watch_list()

const redis_handler = require('../handlers/redis_handler.js')
const mongo = require('../AssetsMongoHandler.js')

// Grab assets from database to avoid api rate limits.
async function add_trait_queue(slug, exp) {
  console.log(`Getting assets for ${slug}...`)
  let counter = 0
  const traits = await mongo.read_traits(slug)
  const assets = []
  console.log(traits.traits)
  const traits_dict = traits.traits
  for (const trait in traits_dict) {
    const query = { slug, traits: { $elemMatch: { value: { $regex: Object.keys(traits_dict[trait])[0], $options: 'i' }, trait_type: { $regex: trait, $options: 'i' } } } }
    const temp_assets = await mongo.find(query, { $caseSensitive: false })
    console.log(`${trait} ${traits_dict[trait]}`)
    for (const a of temp_assets) {
      assets.push(a)
    }
  }
  for (const asset of assets) {
    const trimmed_asset = {}
    trimmed_asset.token_id = asset.token_id
    trimmed_asset.traits = asset.traits
    trimmed_asset.token_address = asset.token_address
    trimmed_asset.slug = asset.slug
    trimmed_asset.event_type = 'trait'
    trimmed_asset.expiration = exp

    await redis_handler.redis_push('collection', trimmed_asset)
    counter += 1
  }
  await redis_handler.print_queue_length('collection')
  console.log(`${counter} ${slug} added.`)
}

async function start() {
  // eslint-disable-next-line global-require
  const readline = require('readline-sync')
  const slug = readline.question('slug: ')
  const exp = readline.question('exp: ')
  add_trait_queue(slug, exp / 60)
}
module.exports = { start, add_trait_queue };

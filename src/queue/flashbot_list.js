/* eslint-disable dot-notation */
/* eslint-disable no-continue */
const { BigNumber, providers, Wallet } = require('ethers');
const { FlashbotsBundleProvider, FlashbotsBundleResolution } = require('@flashbots/ethers-provider-bundle');

const opensea_handler = require('../handlers/opensea_handler.js');
const redis_handler = require('../handlers/redis_handler.js');
const etherscan_handler = require('../handlers/etherscan_handler.js');
const { sleep } = require('../utility/utils.js');
const { FileLogger } = require('../utility/log2file.js');
const watchlistupdater = require('../utility/watchlist_retreiver.js');
const mongo = require('../AssetsMongoHandler.js');

const wyvernContractAddress = '0x7f268357A8c2552623316e2562D90e642bB538E5';
const NULL_ADDRESS_STRING = '0x0000000000000000000000000000000000000000';

const WALLET_MNEUMONIC = process.env.WALL_MNEMONIC;

const { FLASHBOTS_AUTH_KEY } = process.env;

const { INFURA_PROJECT_ID } = process.env;

const GWEI = BigNumber.from(10).pow(9)
const SLIP_ALLOWED = GWEI.mul(40);

const blockToFee = {};

let currBlockNo = 0;
const logger = new FileLogger('flashbotLogs.txt');

if (!FLASHBOTS_AUTH_KEY) {
  throw new Error('Missing FLASHBOTS auth key');
}
if (!WALLET_MNEUMONIC) {
  throw new Error('Missing WALL_MNEMONIC auth key');
}
if (!INFURA_PROJECT_ID) {
  throw new Error('Missing INFURA_PROJECT_ID auth key');
}

const provider = new providers.InfuraProvider(1, INFURA_PROJECT_ID);

const ourWallets = new Set(['0x18a73aaee970af9a797d944a7b982502e1e71556', '0x35c25ff925a61399a3b69e8c95c9487a1d82e7df']);

async function listed_queue_add(event_type, exp, bid) {
  const time_window = 3_000;
  const start_time = Math.floor(+new Date())

  let watch_list = watchlistupdater.getWatchList();
  const orders = await opensea_handler.get_listed_lowered(time_window);
  let balance;
  for (const o of orders) {
    if (o.taker !== NULL_ADDRESS_STRING) {
      console.log('found a private sale');
      setTimeout(() => {
        logger.printLn(`\n${ourWallets.has(o.taker) ? 'OUR PRIVATE SALE!' : 'private sale'} | ${o?.asset?.collection?.slug} | ${o?.asset?.tokenId} | ${o.basePrice/1e18} | ${o?.paymentTokenContract?.name} | ${o?.taker}`);
      }, 900);
      continue;
    }
    if (o.paymentToken !== NULL_ADDRESS_STRING) {
      console.log(`skipping non-eth listing paymentToken: ${o.paymentTokenContract?.name}`);
      continue;
    }

    try {
      let asset = {}
      if (!o.asset) {
        console.log('skipping order with no asset\n');
        continue;
      }
      asset['token_id'] = o.asset?.tokenId
      asset['token_address'] = o.asset.tokenAddress
      asset['slug'] = o.asset.collection.slug
      watch_list = watchlistupdater.getWatchList();
      const watchListCollection = watch_list.find(({ address }) => address === asset['token_address']);
      if (watchListCollection !== undefined) {
        asset['tier'] = watchListCollection['tier'];
        asset['fee'] = o.asset.collection.devSellerFeeBasisPoints / 10000
        asset['event_type'] = event_type
        asset['expiration'] = 0.25
        asset['listed_price'] = o.basePrice / 1000000000000000000

        if (exp !== '') {
          asset['expiration'] = exp / 60
        }
        console.log(`${asset['slug']} | ${asset['token_id']} | ${asset['listed_price']}`)
        const gasBaseFeeRightNow = blockToFee[currBlockNo + 1];
        if (o.taker !== NULL_ADDRESS_STRING) {
          const command = {
            hash: `${asset['slug']}:${asset['token_id']}`,
            slug: asset['slug'],
            collection_address: asset['token_address'],
            token_ids: [asset['token_id']],
            time_suggestion: 60 * 60_000,
          }
          redis_handler.redis_push_command(command);
        }
        if (balance === undefined) {
          balance = await etherscan_handler.get_eth_balance(wallet.address);
        }
        asset = await redis_attach_range(
          event_type,
          asset,
          gasBaseFeeRightNow,
          GWEI.mul(3),
          350_000,
          wallet.address,
          (txt) => { logger.print(txt) },
          balance,
        );
        // console.log('asset:')
        // console.log(asset)
        // redis_handler.redis_push(event_type, asset);
        // if(focus_list.includes(asset['slug'])){
        //   redis_handler.redis_push_command(command)
        // }
        if (asset) {
          const nonce = await provider.getTransactionCount(wallet.address);
          const abiEncoded = await opensea_handler.seaport.getFulfillOrderAbi({
            order: o,
            accountAddress: wallet.address.toLowerCase(),
          });
          // eslint-disable-next-line max-len
          buyTheAsset(wallet, flashbotsProvider, abiEncoded, SLIP_ALLOWED.add(gasBaseFeeRightNow), GWEI.mul(6), nonce, 1)
            .catch((e) => { setTimeout(() => { logger.printLn(`${e}`);}, 6_000)});
          // eslint-disable-next-line max-len
          buyTheAsset(wallet, flashbotsProvider, abiEncoded, SLIP_ALLOWED.add(blockToFee[currBlockNo + 2]), GWEI.mul(6), nonce, 2)
            .catch((e) => { setTimeout(() => { logger.printLn(`${e}`);}, 6_000)});
          // eslint-disable-next-line max-len
          buyTheAsset(wallet, flashbotsProvider, abiEncoded, SLIP_ALLOWED.add(blockToFee[currBlockNo + 3]), GWEI.mul(6), nonce, 3)
            .catch((e) => { setTimeout(() => { logger.printLn(`${e}`);}, 6_000)});
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  const end_time = Math.floor(+new Date())
  if (end_time - start_time < time_window) {
    const wait_time = time_window - (end_time - start_time)
    console.log(`waiting: ${wait_time}ms\n`);
    await sleep(wait_time);
  }
  listed_queue_add(event_type, exp, bid)
}

let authSigner;
// const path = `m/44'/60'/0'/0/${1}`;
let wallet;
let flashbotsProvider;
async function start() {
  await watchlistupdater.startLoop();
  await setupWallets();
  setupFileLogger();
  startGetBlockLoop();
  listed_queue_add('listed', 15, false)
}

function setupFileLogger() {
  logger.open();
}

async function setupWallets() {
  authSigner = new Wallet(FLASHBOTS_AUTH_KEY);
  wallet = Wallet.fromMnemonic(WALLET_MNEUMONIC);
  console.log(wallet.address);
  flashbotsProvider = await FlashbotsBundleProvider.create(provider, authSigner);
}

function startGetBlockLoop() {
  provider.on('block', async (blockNumber) => {
    currBlockNo = blockNumber;
    const block = await provider.getBlock(blockNumber)

    blockToFee[parseInt(blockNumber, 10) + 1] = FlashbotsBundleProvider
      .getMaxBaseFeeInFutureBlock(block.baseFeePerGas, 1);
    blockToFee[parseInt(blockNumber, 10) + 2] = FlashbotsBundleProvider
      .getMaxBaseFeeInFutureBlock(block.baseFeePerGas, 2);
    blockToFee[parseInt(blockNumber, 10) + 3] = FlashbotsBundleProvider
      .getMaxBaseFeeInFutureBlock(block.baseFeePerGas, 3);
    delete blockToFee[parseInt(blockNumber, 10) - 10];
    console.log(`block number: ${blockNumber}`)
  });
}

async function buyTheAsset(wallet, flashbotsProvider, abiEncoded, maxBaseFee, priorityFee, mynonce, BLOCKS_IN_THE_FUTURE) {
  if (!wallet) { throw new Error('No wallet given to testing'); }
  if (!abiEncoded) { throw new Error('No abi given to testing'); }

  const eip1559Transaction = {
    to: wyvernContractAddress,
    value: BigNumber.from(abiEncoded.txnData.value.toString()),
    type: 2,
    maxFeePerGas: priorityFee.add(maxBaseFee), //PRIORITY_FEE.add(MAX_BASE_FEE)
    maxPriorityFeePerGas: priorityFee, //PRIORITY_FEE
    gasLimit: 500_000,
    data: abiEncoded.encoded,
    chainId: 1,
    nonce: mynonce,
  }
  const signedTransactions = await flashbotsProvider.signBundle([{
    signer : wallet,
    transaction: eip1559Transaction,
  }]);
  console.log('signes transaction:')
  console.log(signedTransactions);
  const targetBlock = currBlockNo + BLOCKS_IN_THE_FUTURE
  const simulation = await flashbotsProvider.simulate(signedTransactions, targetBlock);
  if ('error' in simulation) {
    setTimeout(() => { logger.print(`Simulation Error: ${simulation.error.message}`);}, 6_000);
    console.warn(`Block: ${targetBlock}, Simulation Error: ${simulation.error.message}`)
    console.error('Error simulating the transaction');
  } else {
    setTimeout(() => {
      logger.printLn(`Simulation Success: ${JSON.stringify(simulation, null, 2)}`);
    }, 6_000);
    console.log(`Block ${targetBlock}  Simulation Success: ${JSON.stringify(simulation, null, 2)}`)
  }
  const bundleSubmission = await flashbotsProvider.sendRawBundle(signedTransactions, targetBlock)
  console.log('bundle submitted, waiting')
  if ('error' in bundleSubmission) {
    setTimeout(() => {
      logger.printLn(`Failed in target block : ${targetBlock}`);
    }, 6_000);
    throw new Error(bundleSubmission.error.message)
  }
  const waitResponse = await bundleSubmission.wait()
  setTimeout(() => {
    logger.printLn(`Block ${targetBlock} Wait Response: ${FlashbotsBundleResolution[waitResponse]}`);
  }, 6_000);
  console.log(`Wait Response: ${FlashbotsBundleResolution[waitResponse]}`)
  if (waitResponse === FlashbotsBundleResolution.BundleIncluded || waitResponse === FlashbotsBundleResolution.AccountNonceTooHigh) {
    setTimeout(() => {
      logger.printLn('error flashbot resolution response');
    }, 6_000);
    console.error(`Block: ${targetBlock} error flashbot resolution response`);
  } else {
    const obj = {
      bundleStats: await flashbotsProvider.getBundleStats(simulation.bundleHash, targetBlock),
      userStats: await flashbotsProvider.getUserStats()
    };
    console.log(obj);
    setTimeout(() => {
      logger.printLn(`block: ${targetBlock},\n ${JSON.stringify(obj,null, 2)}\n`);
    }, 6_000);
  }
}

async function redis_attach_range(queue_name ,asset, basePrice = (1e9 * 85 ) , priorityFee = (1e9 * 3), gallonsGuess = 350_000, wall_address, writeToFile, account_balance) {
  try{
    if(!asset['traits']){
      let mongo_traits = await mongo.findOne({'slug': asset['slug'], 'token_id': asset['token_id']})
      asset['traits'] = mongo_traits.traits
    }
  } catch(e) {
    console.log('No traits on asset.')
  }
  let watch_list = watchlistupdater.getWatchList();
  let watchListCollection = watch_list.find(({address}) => address === asset['token_address']);
  if(watchListCollection === undefined || watchListCollection['tier'] === 'skip') {
    console.log('already top bid')
    return;
  }
  try {
    asset['tier'] = watchListCollection['tier'];
  } catch(e){
    console.log(asset['slug'])
  }
  let min_range = .61
  let max_range = .81
  if(asset['tier']){
    if(asset['tier'] === 'medium'){
      min_range = .66
      max_range = .86
    } else if(asset['tier'] === 'high'){
      min_range = .71
      max_range = .91
    } else if(asset['tier'] === 'low'){
      min_range = .61
      max_range = .81
    } else if(asset['tier'] === 'medium-low'){
      min_range = .685
      max_range = .835
    }
  }
  asset['bid_range'] = [min_range, max_range]
  let traits = await mongo.read_traits(asset['slug'])
  if (traits) {
    let collection_traits = traits.traits
    for (let trait of (asset.traits || [])){
      if (collection_traits[trait.trait_type.toLowerCase()]){
        if (collection_traits[trait.trait_type.toLowerCase()][trait.value.toLowerCase()]){
          let range = collection_traits[trait.trait_type.toLowerCase()][trait.value.toLowerCase()]
          if (!asset['bid_range']){
            asset['bid_range'] = range
            asset['trait'] = trait.value
          }
          if (range[1] > asset['bid_range'][1]){
            asset['trait'] = trait.value
            asset['bid_range'] = range
          }
        }
      }
    }
  }
  //console.log(`base: ${basePrice.toString()}, pri: ${priorityFee.toString()}, gal: ${gallonsGuess}`)
  const avg_gas_fee = basePrice.add(priorityFee).mul(gallonsGuess).toString()/1e18;

	
  let my_max_range = asset['bid_range'][1]
  let client = redis_handler.client;
  let collection_stats = await client.GET(`${asset['slug']}:stats`)
  let data = JSON.parse(collection_stats)
  let floor_price = data.floor_price
  let fee = data.dev_seller_fee_basis_points/10_000
  let maxToBuy = floor_price * (my_max_range - fee) - avg_gas_fee;
  console.log(`maxbuy: ${maxToBuy} floor: ${floor_price}`);
  console.log(`avg gas: ${avg_gas_fee}`);
  console.log();
  if (asset['listed_price'] > maxToBuy) {
    return;
  }
  setTimeout(() => writeToFile(`\n${asset['slug']}:${asset['token_id']} maxbuy: ${maxToBuy} floor: ${floor_price}\n\n`), 5_000);
  const amount_needed_in_wallet = asset['listed_price'] + (basePrice.add(priorityFee).mul(500_000).toString() / 1e18);
  //const account_balance = await etherscan_handler.get_eth_balance(wall_address);
  if (isNaN(account_balance) || amount_needed_in_wallet > account_balance) {
    setTimeout(() => writeToFile(`\ncould have bought a ${asset['slug']}:${asset['token_id']} !!!!!!!\n`), 5_000);
    console.error(`could have bought a ${asset['slug']}:${asset['token_id']} : needed: ${amount_needed_in_wallet} had: ${account_balance}!!!!!!!`);
    return;
  }
  asset['diff_in_eth'] = (floor_price * (my_max_range - fee)) - asset['listed_price'];
  return asset;
}

module.exports = { start, listed_queue_add };
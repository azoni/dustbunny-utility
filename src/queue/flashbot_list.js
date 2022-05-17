/* eslint-disable dot-notation */
/* eslint-disable no-continue */
const { BigNumber, providers, Wallet, utils } = require('ethers');
const fs = require('fs');
const { FlashbotsBundleProvider, FlashbotsBundleResolution } = require('@flashbots/ethers-provider-bundle');

const opensea_handler = require('../handlers/opensea_handler.js');
const redis_handler = require('../handlers/redis_handler.js');
const etherscan_handler = require('../handlers/etherscan_handler.js');
const { sleep } = require('../utility/utils.js');
const { FileLogger } = require('../utility/log2file.js');
const watchlistupdater = require('../utility/watchlist_retreiver.js');
const mongo = require('../AssetsMongoHandler.js');
const secret = require('../secret.js')

const { MNEMONIC } = secret
const wyvernContractAddress = '0x7f268357A8c2552623316e2562D90e642bB538E5';
const NULL_ADDRESS_STRING = '0x0000000000000000000000000000000000000000';

const WALLET_MNEUMONIC = MNEMONIC

const { FLASHBOTS_AUTH_KEY } = '3f5180f34e788c8440ae24d28f8254241c8390d4674aceea6719071e618bf48c'

const { INFURA_PROJECT_ID } = 'deb8c4096c784171b97a21f7a5b7ba98'

const GWEI = BigNumber.from(10).pow(9)
const SLIP_ALLOWED = GWEI.mul(40);

const blockToFee = {};
let wallet;
let flashbotsProvider;
let currBlockNo = 0;
const logger = new FileLogger('flashbotLogs.txt');

let provider;

function check_credentials_exist() {
  try {
    if (!FLASHBOTS_AUTH_KEY) {
      throw new Error('Missing FLASHBOTS auth key');
    }
    if (!WALLET_MNEUMONIC) {
      throw new Error('Missing WALL_MNEMONIC auth key');
    }
    if (!INFURA_PROJECT_ID) {
      throw new Error('Missing INFURA_PROJECT_ID auth key');
    }
  } catch (e) {
    console.log()
  }
}

function setup_provider() {
  provider = new providers.InfuraProvider(1, INFURA_PROJECT_ID);
}

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
      log2MyFileLn(`\n${ourWallets.has(o.taker) ? 'OUR PRIVATE SALE!' : 'private sale'} | ${o?.asset?.collection?.slug} | ${o?.asset?.tokenId} | ${o.basePrice / 1e18} | ${o?.paymentTokenContract?.name} | ${o?.taker}`);
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
				if (!gasBaseFeeRightNow) {
					console.error('No gas found: ', gasBaseFeeRightNow);
				}
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
          GWEI.mul(10),
          350_000,
          wallet.address,
          (txt) => { log2MyFile(txt) },
          balance,
        );
        if (asset) {
          const nonce = await provider.getTransactionCount(wallet.address);
          const abiEncoded = await opensea_handler.seaport.getFulfillOrderAbi({
            order: o,
            accountAddress: wallet.address.toLowerCase(),
          });
          // eslint-disable-next-line max-len
          buyTheAsset(wallet, flashbotsProvider, abiEncoded, SLIP_ALLOWED.add(gasBaseFeeRightNow || 30), GWEI.mul(50), nonce, 1, asset['extraGwei'])
            .catch((e) => { log2MyFileLn(`${e} \n ---\n ${e?.stack} `) });
          // eslint-disable-next-line max-len
          buyTheAsset(wallet, flashbotsProvider, abiEncoded, SLIP_ALLOWED.add(blockToFee[currBlockNo + 2] || 30), GWEI.mul(50), nonce, 2, asset['extraGwei'])
            .catch((e) => {  log2MyFileLn(`${e} \n ---\n ${e?.stack} `) });
          // eslint-disable-next-line max-len
          buyTheAsset(wallet, flashbotsProvider, abiEncoded, SLIP_ALLOWED.add(blockToFee[currBlockNo + 3] || 30), GWEI.mul(50), nonce, 3, asset['extraGwei'])
            .catch((e) => {  log2MyFileLn(`${e} \n ---\n ${e?.stack} `) });
					buyTheAsset(wallet, flashbotsProvider, abiEncoded, SLIP_ALLOWED.add(blockToFee[currBlockNo + 4] || 30 ), GWEI.mul(50), nonce, 4, asset['extraGwei'])
            .catch((e) => {  log2MyFileLn(`${e} \n ---\n ${e?.stack} `) });
					try {
						redis_handler.redis_push_listing_to_buy(o).catch((e) => console.error(e?.stack));
					} catch (error) {
						console.error(error.stack);
					}
					try {
						log2MyFileLn(`value: ${abiEncoded?.txnData?.value?.toString()}, slug: ${asset['slug']}, tokenid: ${asset['token_id']} block: ${currBlockNo}`);
					} catch {

					}
        }
      }
    } catch (e) {
      console.error(e);
			log2MyFileLn(`Some Error: ${e}\n =======\n ${e?.stack}`);
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

async function start() {
  await watchlistupdater.startLoop();
  check_credentials_exist();
  setup_provider();
  await setupWallets();
  //setupFileLogger();
  startGetBlockLoop();
  listed_queue_add('listed', 15, false)
}

//function setupFileLogger() {
//  logger.open();
//}

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
		blockToFee[parseInt(blockNumber, 10) + 4] = FlashbotsBundleProvider
      .getMaxBaseFeeInFutureBlock(block.baseFeePerGas, 4);
    delete blockToFee[parseInt(blockNumber, 10) - 10];
    console.log(`block number: ${blockNumber}`)
  });
}

async function buyTheAsset(
  specifiedWallet,
  flashbotsProvider,
  abiEncoded,
  maxBaseFee,
  priorityFee,
  mynonce,
  BLOCKS_IN_THE_FUTURE,
	extraGwei
) {
  if (!specifiedWallet) { throw new Error('No wallet given to testing'); }
  if (!abiEncoded) { throw new Error('No abi given to testing'); }

	let myMaxFeePerGas = priorityFee.add(maxBaseFee);
	let myPriorityFee = priorityFee;
	console.log(`Extra Gwei: ${extraGwei}`);
	if (extraGwei !== undefined) {
		myMaxFeePerGas = extraGwei.add(myMaxFeePerGas)
		myPriorityFee = extraGwei.add(myPriorityFee)
	}

  const eip1559Transaction = {
    to: wyvernContractAddress,
    value: BigNumber.from(abiEncoded.txnData.value.toString()),
    type: 2,
    maxFeePerGas: myMaxFeePerGas, // PRIORITY_FEE.add(MAX_BASE_FEE)
    maxPriorityFeePerGas: myPriorityFee, // PRIORITY_FEE
    gasLimit: 500_000,
    data: abiEncoded.encoded,
    chainId: 1,
    nonce: mynonce,
  }
  const signedTransactions = await flashbotsProvider.signBundle([{
    signer: specifiedWallet,
    transaction: eip1559Transaction,
  }]);
  console.log('signes transaction:')
  console.log(signedTransactions);
  const targetBlock = currBlockNo + BLOCKS_IN_THE_FUTURE
  const simulation = await flashbotsProvider.simulate(signedTransactions, targetBlock);
  if ('error' in simulation) {
		log2MyFileLn(`Block: ${targetBlock}, Simulation Error: ${simulation.error.message}`);
    console.warn(` Simulation Error: ${simulation.error.message}`)
    console.error('Error simulating the transaction');
  } else {
    log2MyFileLn(`Simulation Success: ${JSON.stringify(simulation, null, 2)}`);
    console.log(`Block ${targetBlock},  Simulation Success: ${JSON.stringify(simulation, null, 2)}`)
  }
  const bundleSubmission = await flashbotsProvider.sendRawBundle(signedTransactions, targetBlock)
  console.log('bundle submitted, waiting')
  if ('error' in bundleSubmission) {
    log2MyFileLn(`Failed in target block : ${targetBlock}, val`);
    throw new Error(bundleSubmission.error.message)
  }
  const waitResponse = await bundleSubmission.wait()
  log2MyFileLn(`Block ${targetBlock} Wait Response: ${FlashbotsBundleResolution[waitResponse]}`);
  console.log(`Wait Response: ${FlashbotsBundleResolution[waitResponse]}`)
  if (waitResponse === FlashbotsBundleResolution.BundleIncluded
      || waitResponse === FlashbotsBundleResolution.AccountNonceTooHigh) {
    log2MyFileLn('error flashbot resolution response');
    console.error(`Block: ${targetBlock} error flashbot resolution response`);
  } else {
    const obj = {
      bundleStats: await flashbotsProvider.getBundleStats(simulation.bundleHash, targetBlock),
      userStats: await flashbotsProvider.getUserStats(),
    };
    console.log(obj);
    log2MyFileLn(`block: ${targetBlock},\n ${JSON.stringify(obj, null, 2)}\n`);
  }
}

async function redis_attach_range(
  queue_name,
  myAsset,
  basePrice = GWEI.mul(85),
  priorityFee = GWEI.mul(3),
  gallonsGuess = 350_000,
  wall_address,
  writeToFile,
  account_balance,
) {
  const asset = myAsset;
  try {
    if (!asset['traits']) {
      const mongo_traits = await mongo.findOne({ slug: asset['slug'], token_id: asset['token_id'] })
      asset['traits'] = mongo_traits.traits
    }
  } catch (e) {
    console.log('No traits on asset.')
  }
  const watch_list = watchlistupdater.getWatchList();
  const watchListCollection = watch_list.find(({ address }) => address === asset['token_address']);
  if (watchListCollection === undefined || watchListCollection['tier'] === 'skip') {
    console.log('already top bid')
    return undefined;
  }
  try {
    asset['tier'] = watchListCollection['tier'];
  } catch (e) {
    console.log(asset['slug'])
  }
  let min_range = 0.61
  let max_range = 0.81
  if (asset['tier']) {
    if (asset['tier'] === 'medium') {
      min_range = 0.66
      max_range = 0.86
    } else if (asset['tier'] === 'high') {
      min_range = 0.71
      max_range = 0.91
    } else if (asset['tier'] === 'low') {
      min_range = 0.61
      max_range = 0.81
    } else if (asset['tier'] === 'medium-low') {
      min_range = 0.685
      max_range = 0.835
    }
  }
  asset['bid_range'] = [min_range, max_range]
  const traits = await mongo.read_traits(asset['slug'])
  if (traits) {
    const collection_traits = traits.traits
    for (const trait of (asset.traits || [])) {
      if (collection_traits[trait.trait_type.toLowerCase()]) {
        if (collection_traits[trait.trait_type.toLowerCase()][trait.value.toLowerCase()]) {
          const range = collection_traits[trait.trait_type.toLowerCase()][trait.value.toLowerCase()]
          if (!asset['bid_range']) {
            asset['bid_range'] = range
            asset['trait'] = trait.value
          }
          if (range[1] > asset['bid_range'][1]) {
            asset['trait'] = trait.value
            asset['bid_range'] = range
          }
        }
      }
    }
  }

	if (watchListCollection.db_range && !asset.trait) {
    asset.bid_range = watchListCollection.db_range
  }
  const avg_gas_fee = basePrice.add(priorityFee).mul(gallonsGuess).toString() / 1e18;

  const my_max_range = asset['bid_range'][1]
  const { client } = redis_handler;
  const collection_stats = await client.GET(`${asset['slug']}:stats`)
  const data = JSON.parse(collection_stats)
  const { floor_price } = data
  const fee = data.dev_seller_fee_basis_points / 10_000
  let maxToBuy = watchListCollection.db_fixed || floor_price * (my_max_range - fee) - avg_gas_fee;

	if (watchListCollection.db_fixed) {console.log(`FIXED: ${watchListCollection.db_fixed}`)}
  console.log(`maxbuy: ${maxToBuy} floor: ${floor_price}`);
  console.log(`avg gas: ${avg_gas_fee}`);
  console.log();
  if (asset['listed_price'] > maxToBuy) {
    return undefined;
  }

  writeToFile(`\n${asset['slug']}:${asset['token_id']} maxbuy: ${maxToBuy} floor: ${floor_price}\n\n`);
	const ourFee = basePrice.add(priorityFee).mul(500_000).toString() / 1e18;

  const amount_needed_in_wallet = asset['listed_price'] + ourFee;
	const ourCost = asset['listed_price'] + (basePrice.add(priorityFee).mul(350_000).toString() / 1e18)
	
  // const account_balance = await etherscan_handler.get_eth_balance(wall_address);
  if (Number.isNaN(account_balance) || amount_needed_in_wallet > account_balance) {
    writeToFile(`\ncould have bought a ${asset['slug']}:${asset['token_id']} !!!!!!!\n`);
    console.error(`could have bought a ${asset['slug']}:${asset['token_id']} : needed: ${amount_needed_in_wallet} had: ${account_balance}!!!!!!!`);
    return undefined;
  }
	const diff = maxToBuy - ourCost;
	const cut = diff * 0.5; 
	const ourCostWithCut = (ourCost + cut);
	const cutInEth = utils.parseEther(cut.toFixed(4).toString());
	console.log(`diff: ${diff}, cut: ${cut}, ourCostWithCut: ${ourCostWithCut}`)
	console.log(`cutInEth: ${cutInEth}`)
	console.log(`if1: ${ourCostWithCut < maxToBuy && ourCostWithCut < account_balance}`);
	console.log(`if2: ${ourCostWithCut < maxToBuy && ourCostWithCut >= account_balance}`);
	if (ourCostWithCut < maxToBuy && ourCostWithCut < account_balance) {
		
		const extraGwei = cutInEth.div(350_000);
		if (extraGwei.lt(GWEI.mul(15_000))) {
			console.log('too much gwei')
			asset['extraGwei'] = extraGwei;
		}
	} else if (ourCostWithCut < maxToBuy && ourCostWithCut >= account_balance) {
		const limitedCut = account_balance - ourCost;
		if (limitedCut > 0) {
			const extraGwei = cutInEth.div(500_000);
			if (extraGwei.lt(GWEI.mul(15_000))) {
				console.log('too much gwei')
				asset['extraGwei'] = extraGwei;
			}
		}
	}

  asset['diff_in_eth'] = (floor_price * (my_max_range - fee)) - asset['listed_price'];
  return asset;
}

function log2MyFile(txt) {
	const stream = fs.createWriteStream('FlasbotLogs.txt', { flags: 'a' });
	stream.write(txt);
	stream.close();
}

function log2MyFileLn(txt) {
	log2MyFile(`${txt}\n`);
}

module.exports = { start, listed_queue_add };

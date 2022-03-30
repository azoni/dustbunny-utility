// eslint-disable-next-line import/no-extraneous-dependencies
const fetch = require('node-fetch');
const mongo = require('../AssetsMongoHandler.js')
const watchlistupdater = require('../utility/watchlist_retreiver.js');
const redis_handler = require('../handlers/redis_handler.js');

const { client } = redis_handler;

let watch_list;

/**
 * All the address seen in the last 30 minutes;
 */

const walletAddressSeenWithinXMins = {};
const LIMIT_30_MINS = 1_800_000;
let block = 0;
let staking_collections;
let running_nft_total = 0

const ETHERSCAN_API_KEY = 'AXQRW5QJJ5KW4KFAKC9UH85J9ZFDTB95KQ'

/**
 * Every minute clean up the wallet address map
 * by removing all items older than 30 minutes.
 */
function cleanupWalletAddressMap() {
  console.log('clean up process');
  const t = Date.now();
  for (const key in walletAddressSeenWithinXMins) {
    if (t - walletAddressSeenWithinXMins[key] >= LIMIT_30_MINS) {
      delete walletAddressSeenWithinXMins[key];
    }
  }
  setTimeout(cleanupWalletAddressMap, 60_000);
}

async function getJSONFromFetch(f) {
  const r = await f;
  return r.json();
}
async function get_latest_block(retry = 3) {
  console.log('Getting lastest block...')
  try {
    const block_response = fetch('https://api.etherscan.io/api?module=proxy&action=eth_blockNumber&apikey=AXQRW5QJJ5KW4KFAKC9UH85J9ZFDTB95KQ');
    const block_data = await getJSONFromFetch(block_response);
    const blockNo = parseInt(block_data.result, 16);
    if (block_data.status === '0') {
      console.log(block_data);
      throw new Error('recieived error from latest block api')
    }
    console.log(blockNo);
    return blockNo;
  } catch (error) {
    console.warn('warning: retrying get latest block')
    console.warn(error);
    if (retry > 0) {
      await sleep(1_000);
      return get_latest_block(retry - 1);
    }
    throw new Error('Consistent error retrieving latest block.');
  }
}

// eslint-disable-next-line no-shadow
async function getCollectionTransactions(collectionAddress, block, retry = 3) {
  if (!collectionAddress || !block) {
    throw new Error('invalid args to getCollectionTransactions');
  }
  try {
    const response = await fetch(`https://api.etherscan.io/api?module=account&action=tokennfttx&contractaddress=${
      collectionAddress
    }&page=1&startblock=${
      block
    }&offset=100&sort=desc&apikey=${
      ETHERSCAN_API_KEY}`);
    const data = await response.json()
    if (!Array.isArray(data.result)) {
      console.log(block)
      console.log(collectionAddress)
      console.log(data);
      throw new Error('Error from collection transactions api');
    }
    return data;
  } catch (error) {
    console.warn(error)
    if (retry > 0) {
      await sleep(1_000);
      return getCollectionTransactions(collectionAddress, block, retry - 1);
    }
    throw new Error(error);
  }
}
const botAddresses = new Set([
  '0xb00d318274625c112cf6f0498a6fa62929c3fcb0',
  '0xb9285dc27576f1122b0d2612204fd02c006dc47c',
  '0x9257a4bdc6e6de95e1c662bf66583735a779736f',
  '0x17a27ae4e9b5975d670c18966561ab3cefb57d7c',
  '0x7dda6e90f5ae012d8b611d71aef2912e48c6611b',
  '0x5a6f8b066c48483aa0b641ff961468ba77cffcd5',
  '0x621028759484648ca6fd0c24ddbfade21f231593',
  '0x0fd6a6e97e5afaec8f42a46a918128358c0b76dc',
  '0xc3e1bf433a3ec3d098631f87e49c1908afa9a3d3',
  '0x4165b0092119a4a3869fb6a04c819a76e7a95386',
  '0x208fd469595f97fe3d589bf9dcea7b96ef76a7cf',
  '0x0b603f944d03e37424f8bb29d1f1c9d788f4771f',
  '0xc8acf47df30286159220e8d58467a614dc07bc72',
  '0x0ecbba0ccb440e0d396456bacdb3ce2a716b96e5',
  '0x3a6ae92bc396f818d87e60b0d3475ebf37b9c2ea',
  '0x701c1a9d3fc47f7949178c99b141c86fac72a1c4',
  '0xfdb32c8ddda21172a031d928056e19725a0836c5',
  '0xdc3b7ef263f1cdaa25ffa93c642639f5f4f2a669',
  '0xadee30341a9e98ed145ccb02b00da15e74e305b5',
  '0x483b71d5b5661c2340273dc1219c4f94dacf5cc8',
  '0x15cba6d3b98d220bc1ecda89afdf07dd0bf06c5d',
  '0xbb2cd2434ca0881bcdcce88f6e77c607fc71c128',
  '0x07b52eac4361f6aa840237e20afe89fe5eb8d031',
  '0x41f01d8f02c569be620e13c9b33ce803bed84e90',
  '0x26054c824ff0a6225dfa24a1eebd6a18de6b5f7d',
  '0x5bcfc791b9baa68e9aa50eb98e555304ad53d697',
  '0x429cdc4baf9d216fbff22a8eeb56bc7a225329c0',
  '0x277371339da18e8c5c4dc4c799fa556df62c6b71',
  '0x16f98ff6bb49d329bc92ed5051c7e901c8ee976e',
  '0xee87f1579c7743683ad41aa3ca2477f5f40a4b34',
  '0x0e78c12ad4c2e31ff38c4c0ce2fea1e57b838d47',
  '0x4af807f19aa181fa3eae8bc7481e571c039f2edc',
  '0x91aedd38aba370dc9ebdeaa660d2920cb4920e98',
  '0xdeef55689a46931754ff18d76ccda30459786bc0',
  '0x1a5355f31ee2652f0040151856ff60ddd23d81cc',
  '0x4d64bdb86c7b50d8b2935ab399511ba9433a3628',
  '0x18a73aaee970af9a797d944a7b982502e1e71556',
  '0x1aec9c6912d7da7a35803f362db5ad38207d4b4a',
  '0x35c25ff925a61399a3b69e8c95c9487a1d82e7df',
]);

async function get_etherscan_transactions() {
  let ourlatest = await get_latest_block()
  if (block === ourlatest) {
    await sleep(500);
    get_etherscan_transactions()
    return
  }
  block += 1
  console.log('starting transactions')
  console.log(`block: ${block}`)
  let tx_count = 0;

  const walletAlreadyBidOnInThisLoop = new Set();
  let callTracer = 0;
  watch_list = watchlistupdater.getWatchList();
  for (const collection of watch_list) {
    callTracer = (callTracer + 1) % 10;
    if (!callTracer) { console.log('went through 10') }
    const walletsToBidOnDict = {};

    let data;

    try {
      data = await getCollectionTransactions(collection.address, block);
    } catch (error) {
      console.warn(error);
      // eslint-disable-next-line no-continue
      continue;
    }

    const potentialSellerSet = new Set();
    tx_count += data.result.length
    for (const tx of data.result) {
      let event_type = 'transfer'
      if (tx.blockNumber > ourlatest) { ourlatest = tx.blockNumber; }
      if (botAddresses.has(tx.to?.toLowerCase()) && !staking_collections
        .includes(tx.from?.toLowerCase())) {
        potentialSellerSet.add(tx.from);
      }
      if (staking_collections.includes(tx.from)) {
        event_type = 'unstake'
      } else if (staking_collections.includes(tx.to)) {
        event_type = 'stake'
      }
      if (tx.from === '0x0000000000000000000000000000000000000000') {
        event_type = 'mint'
      }

      if (!tx.to || !tx.from) {
        console.log('error')
        console.log(collection);
      } else {
        walletsToBidOnDict[tx.to] = event_type;
        walletsToBidOnDict[tx.from] = event_type;
      }
    }

    const potentialSellerArr = Array.from(potentialSellerSet);

    for (const seller of potentialSellerArr) {
      await send_wallet_nfts_to_focus(seller, collection.address)
    }

    const timestamp = Date.now();
    // continue;
    for (const address in walletsToBidOnDict) {
      const event_type = walletsToBidOnDict[address];
      if (walletAlreadyBidOnInThisLoop.has(address)
          || (address in walletAddressSeenWithinXMins
              && timestamp - walletAddressSeenWithinXMins[address] < LIMIT_30_MINS)
      ) {
        console.log('skipping some');
        // eslint-disable-next-line no-continue
        continue;
      }
      walletAddressSeenWithinXMins[address] = timestamp;
      walletAlreadyBidOnInThisLoop.add(address);
      try {
        await get_nfts_from_wallet(address, event_type);
      } catch (error) {
        console.warn(error);
        console.warn(`strangely we failed to get nfts from address: ${address}`)
      }
    }
  }
  console.log(`tx found: ${tx_count}`)
  console.log(`total nfts found: ${running_nft_total}`)
  block = ourlatest;
  get_etherscan_transactions()
}

async function getNftTransactionsForAddress(address, retry = 3) {
  if (address === undefined) {
    throw new Error('invalid arg for getNftTransactionsForAddress');
  }
  try {
    const f = fetch(`https://api.etherscan.io/api?module=account&action=tokennfttx&address=${address}&startblock=0&endblock=999999999&sort=asc&apikey=${ETHERSCAN_API_KEY}`)
    const myData = await getJSONFromFetch(f);
    if (myData.status === '0') {
      throw new Error('Error from tokennfttx api');
    }
    return myData;
  } catch (error) {
    console.warn(error);
    if (retry > 0) {
      await sleep(1_000);
      return getNftTransactionsForAddress(address, retry - 1);
    }
    throw new Error('Consistent error from getNftTransactionsForAddress');
  }
}

async function get_nfts_from_wallet(interestAddress, event_type) {
  console.log('get_nfts_from_wallet');
  if (staking_collections.includes(interestAddress)) { return; }
  // const interestAddress = "0xcae462347cd2d83f9a548afacb2ca6e0c6063bff";
  const myData = await getNftTransactionsForAddress(interestAddress);

  // console.log(Object.keys(myData), myData.status, myData.message, myData.result?.length);

  const miniDb = {};

  // console.log(myData.result[0]);
  const allNftTX = myData.result || [];

  function upsertContract(contractAddress) {
    if (!(contractAddress in miniDb)) {
      miniDb[contractAddress] = {};
    }
  }

  function upsertTokenId(contractAddress, tokenId) {
    if (!(tokenId in miniDb[contractAddress])) {
      miniDb[contractAddress][tokenId] = {};
    }
  }

  for (const tx of allNftTX) {
    upsertContract(tx.contractAddress);
    upsertTokenId(tx.contractAddress, tx.tokenID);
    if (tx.to === interestAddress) {
      const lastTo = miniDb[tx.contractAddress][tx.tokenID].toTime || -1;
      miniDb[tx.contractAddress][tx.tokenID].toTime = Math.max(tx.timeStamp, lastTo)
    } else if (tx.from === interestAddress) {
      const lastFrom = miniDb[tx.contractAddress][tx.tokenID].fromTime || -1;
      miniDb[tx.contractAddress][tx.tokenID].fromTime = Math.max(tx.timeStamp, lastFrom);
    } else {
      console.error('error!!!');
    }
  }
  let ownCount = 0;
  const countMap = {};
  watch_list = watchlistupdater.getWatchList();
  for (const c in miniDb) {
    for (const id in miniDb[c]) {
      const boughtTime = miniDb[c][id].toTime || -Infinity;
      const soldTime = miniDb[c][id].fromTime || -Infinity;
      if (boughtTime > soldTime) {
        if (!(c in countMap)) { countMap[c] = 0; }
        countMap[c] += 1;
        const watchListCollection = watch_list.find(({ address }) => address === c);
        if (watchListCollection !== undefined) {
          // console.log(`${c} : { tokenid: ${id} }`);
          ownCount += 1
          const asset = {}
          asset.token_id = id
          asset.token_address = c
          asset.slug = watchListCollection.slug;
          asset.event_type = event_type
          asset.tier = watchListCollection.tier;
          redis_handler.redis_push('transfer', asset);
        }
      }
    }
  }
  console.log(`owned by: ${interestAddress}`)
  running_nft_total += ownCount
  console.log(`total own: ${ownCount}`);
}

async function send_wallet_nfts_to_focus(interestAddress, collectionToFocusOn) {
  console.log('send_wallet_nfts_to_focus called!!!!')
  if (staking_collections.includes(interestAddress)) { return; }

  const myData = await getNftTransactionsForAddress(interestAddress);

  const miniDb = {};

  const allNftTX = myData.result || [];

  function upsertContract(contractAddress) {
    if (!(contractAddress in miniDb)) {
      miniDb[contractAddress] = {};
    }
  }

  function upsertTokenId(contractAddress, tokenId) {
    if (!(tokenId in miniDb[contractAddress])) {
      miniDb[contractAddress][tokenId] = {};
    }
  }

  for (const tx of allNftTX) {
    upsertContract(tx.contractAddress);
    upsertTokenId(tx.contractAddress, tx.tokenID);
    if (tx.to === interestAddress) {
      const lastTo = miniDb[tx.contractAddress][tx.tokenID].toTime || -1;
      miniDb[tx.contractAddress][tx.tokenID].toTime = Math.max(tx.timeStamp, lastTo)
    } else if (tx.from === interestAddress) {
      const lastFrom = miniDb[tx.contractAddress][tx.tokenID].fromTime || -1;
      miniDb[tx.contractAddress][tx.tokenID].fromTime = Math.max(tx.timeStamp, lastFrom);
    } else {
      console.error('error!!!');
    }
  }
  watch_list = watchlistupdater.getWatchList();
  const focusList = watch_list.filter(({ focus, address }) => focus
  && address !== collectionToFocusOn);
  const collectionMetaData = watch_list.find(({ address }) => address === collectionToFocusOn);

  if (collectionMetaData) {
    const command = {
      hash: `${interestAddress}:${collectionToFocusOn}`,
      slug: collectionMetaData.slug,
      collection_address: collectionMetaData.address,
      token_ids: [],
    }
    const t_list = [];
    if (collectionToFocusOn in miniDb) {
      for (const id in miniDb[collectionToFocusOn]) {
        const boughtTime = miniDb[collectionToFocusOn][id].toTime || -Infinity;
        const soldTime = miniDb[collectionToFocusOn][id].fromTime || -Infinity;
        if (boughtTime > soldTime) {
          t_list.push(id);
        }
      }
    }
    if (t_list.length !== 0) {
      command.token_ids = t_list;
      console.log('sending a command!!!::')
      console.log(command);
      redis_handler.redis_push_command(command)
        .catch((e) => console.error(e));
    }
  }
  for (const el of focusList) {
    const t_list = [];
    if (el.address in miniDb) {
      for (const id in miniDb[el.address]) {
        const boughtTime = miniDb[el.address][id].toTime || -Infinity;
        const soldTime = miniDb[el.address][id].fromTime || -Infinity;
        if (boughtTime > soldTime) {
          t_list.push(id);
        }
      }
    }
    if (t_list.length !== 0) {
      const command = {
        hash: `${interestAddress}:${el.address}`,
        slug: el.slug,
        collection_address: el.address,
        token_ids: t_list,
      }
      console.log('sending more stuff!!')
      console.log(command);
      redis_handler.redis_push_command(command)
        .catch((e) => console.error(e));
    }
  }
}

async function dump_queue(queue_name) {
  client.DEL(`queue:${queue_name}`)
  console.log(await client.LLEN(`queue:${queue_name}`))
}

async function transfer_queue_start() {
  dump_queue('transfer')
  watch_list = watchlistupdater.getWatchList();
  block = await get_latest_block() - 1;
  get_etherscan_transactions()
}
async function start() {
  dump_queue('transfer')
  await watchlistupdater.startLoop();
  staking_collections = await mongo.readStakingWallets()
  staking_collections = staking_collections.map((el) => el.address)
  setTimeout(cleanupWalletAddressMap, LIMIT_30_MINS);
  transfer_queue_start()
}
async function sleep(ms) {
  // eslint-disable-next-line no-promise-executor-return
  await new Promise((resolve) => setTimeout(resolve, ms))
}
module.exports = { start }
// start()

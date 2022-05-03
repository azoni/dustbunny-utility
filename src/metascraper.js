const fetch = require('node-fetch');
const throttledQueue = require('throttled-queue');
const { FileLogger } = require('./utility/log2file.js');
const mongo_handler = require('./handlers/mongo_handler.js');
const { update_traits } = require('./handlers/mongo_handler.js');

const INCLUSIVE_FROM_TOKEN_ID = 271;
const INCLUSIVE_TO_TOKEN_ID = 290;// 1949
const MY_COLLECTION_PATH = 'QmdDBhT2rWB9xJCksf8qmjJ1qqRkjiavM91CBn2XaqvjjQ';
//const MY_COLLECTION_PATH = 'QmNN69NeVQJ3iCscZvxgrzdUdRuXD3E7gRZWesDcEjpPTt';

const CALLS_PER_TIME_LIMIT = 5;
const TIME_LIMIT = 1_000;
//const SLUG = 'alienfrensnft';
const SLUG = 'shinsekai-portal';

const ipfs_throttle = throttledQueue(CALLS_PER_TIME_LIMIT, TIME_LIMIT);

async function saveTraitsToDb(token_id, traits = []) {
  return update_traits(SLUG, token_id, traits);
}
// fetch('https://ipfs.io/ipfs/QmaUQ7DKqD8PK9F88Q7ycjEHcjgsjQ5isvY2PaTGFB3oAq/14001')
// .then((response) => response.json());

// function grab_token_id_from_token_url(url) {
//  const rx = /(?<!^)[^0-9a-zA-Z]([a-z0-9A-Z]{1,8})[^a-zA-Z0-9]{0,5}$/;
//  const something = rx.exec(url);
//  if (typeof something[1] === 'string') {
//    return something[1];
//  }
//  return undefined;
// }

function build_token_id_path(token_id) {
  return `${token_id}`;
}

function build_public_ipfs_url(collection_path, assetPath) {
  // return `https://ipfs.io/ipfs/${collection_path}/${assetPath}`; metrovers
  return `https://azuki-airdrop.s3.amazonaws.com/podz_metadatas/${assetPath}` // beanz
}

// function get_collection_path(url_parts) {
//  let longest_len = 0;
//  let collection_path;
//  const NON_ALPHANUMERIC = /[^a-zA-Z0-9]/;
//  for (const str of url_parts) {
//    const len = str.length;
//    if (len >= longest_len && len > 20 && !NON_ALPHANUMERIC.test(str)) {
//      longest_len = len;
//      collection_path = str;
//    }
//  }
//  return collection_path;
// }

// function split_url_into_nice_pieces(the_url) {
//  const edited_url = the_url.replaceAll(/([^a-zA-Z0-9]+)/g, ',$1,');
//  const arr3 = edited_url.split(',');
//  return arr3;
// }

function has_meta_data_stayed_the_same(data) {
  return (data?.attributes?.length === 1
    && data.attributes[0]?.value !== undefined
    && data.attributes[0]?.trait_type !== undefined
    && data.attributes[0]?.value?.toLowerCase() === 'doing something'
    && data.attributes[0]?.trait_type?.toLowerCase() === 'devs'
  );
}

async function main() {
  const token_ids_to_check = new Set();
  await mongo_handler.connect();
  for (let i = INCLUSIVE_FROM_TOKEN_ID; i <= INCLUSIVE_TO_TOKEN_ID; i++) {
    token_ids_to_check.add(i);
  }
  const logger = new FileLogger('helloworld.txt');
  await logger.open();

  while (token_ids_to_check.size > 0) {
    const arr = [];
    for (const my_token_id of token_ids_to_check) {
      token_ids_to_check.add(my_token_id);
      const token_id_path = build_token_id_path(my_token_id);
      const public_ipfs_url = build_public_ipfs_url(MY_COLLECTION_PATH, token_id_path);
      const p = ipfs_throttle(async () => fetch(public_ipfs_url)
        .then((response) => response.json())
        .then((res_json) => {
          if (has_meta_data_stayed_the_same(res_json)) {
            console.log(`no change for ${my_token_id}`);
          } else if (Array.isArray(res_json?.attributes) && res_json.attributes.length > 0) {
            token_ids_to_check.delete(my_token_id);
            // return saveTraitsToDb(my_token_id, res_json.attributes)
            //  .catch((e) => {
            //    console.error(e.stack);
            //    token_ids_to_check.add(my_token_id);
            //  })
          }
          return undefined;
        }));
      arr.push(p);
    }
    await Promise.all(arr).catch((e) => console.error(e.stack))
  }

  logger.close();
  return mongo_handler.close();
}

main();

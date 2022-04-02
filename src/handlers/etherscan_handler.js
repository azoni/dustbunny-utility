const API_KEY = 'AXQRW5QJJ5KW4KFAKC9UH85J9ZFDTB95KQ'

async function get_eth_balance(address) {
  try {
    const response = await fetch(`https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${API_KEY}`);
    const data = await response.json()

    return parseFloat(data.result / 1000000000000000000)
  } catch (error) {
    console.log('Looks like there was a problem: ', error);
  }
  return 0
}

async function get_weth_balance(address) {
  try {
    const response = await fetch(`https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2&address=${address}&tag=latest&apikey=${API_KEY}`)
    const data = await response.json()
    return parseFloat(data.result / 1000000000000000000)
  } catch (error) {
    console.log('Looks like there was a problem: ', error);
  }
  return 0
}

module.exports = { get_eth_balance, get_weth_balance };

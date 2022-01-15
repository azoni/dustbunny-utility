const values = require('./values.js')
const secret = require('./secret.js')
const opensea = require("opensea-js")
const OpenSeaPort = opensea.OpenSeaPort;
const Network = opensea.Network;
const MnemonicWalletSubprovider = require("@0x/subproviders")
.MnemonicWalletSubprovider;
const RPCSubprovider = require("web3-provider-engine/subproviders/rpc");
const Web3ProviderEngine = require("web3-provider-engine");
const MNEMONIC = secret.default.MNEMONIC
const mnemonicWalletSubprovider = new MnemonicWalletSubprovider({
  mnemonic: MNEMONIC,
});
var currentHour = new Date().getHours()
var INFURA_KEY = values.default.INFURA_KEY[Math.floor(currentHour/6)]
var infuraRpcSubprovider = new RPCSubprovider({
  rpcUrl: "https://mainnet.infura.io/v3/" + INFURA_KEY
});
var providerEngine = new Web3ProviderEngine();
providerEngine.addProvider(mnemonicWalletSubprovider);
providerEngine.addProvider(infuraRpcSubprovider);

const seaport = new OpenSeaPort(

  providerEngine,
  {
    networkName: Network.Main,
    apiKey: values.default.API_KEY
  },
  (arg) => console.log(arg)
);

// async function transfer(){
// 	const transactionHash = await seaport.transfer({
// 		asset: {
// 			tokenAddress: '0xc6ec80029cd2aa4b0021ceb11248c07b25d2de34', // CryptoKitties
// 			tokenId: '892', // Token ID
// 	    },
// 		fromAddress: '0xc4cf8d37a72463722fde94a6ac1867e3c482a85c', // Must own the asset
// 		toAddress:  '0xcae462347cd2d83f9a548afacb2ca6e0c6063bff'
// 	})
// }
// document.getElementById('transfer').addEventListener('click', function(){	
// 	transfer()
// })
//AXQRW5QJJ5KW4KFAKC9UH85J9ZFDTB95KQ - etherscan apikey
const API_KEY = 'AXQRW5QJJ5KW4KFAKC9UH85J9ZFDTB95KQ'
const ADDRESS = '0xcae462347cd2d83f9a548afacb2ca6e0c6063bff'


var balance = 0
var weth_balance = 0
async function get_balance(address){
	try {
	  const response = await fetch('https://api.etherscan.io/api?module=account&action=balance&address=' + address + '&tag=latest&apikey=' + API_KEY);
	  const data = await response.json()
	  console.log(data.result)
	  balance = parseFloat(balance) + parseFloat(data.result/1000000000000000000)
	  console.log(balance)
	  document.getElementById('account').innerHTML = 'Total ' + balance.toFixed(4) + ' ETH ' + weth_balance.toFixed(4) + ' WETH'

	} catch (error) {
	  console.log('Looks like there was a problem: ', error);
	}
}
async function get_weth_balance(address){
	try {
	  const response = await fetch('https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2&address=' + address + '&tag=latest&apikey=' + API_KEY)
	  const data = await response.json()
	  console.log('weth--')
	  weth_balance = parseFloat(weth_balance) + parseFloat(data.result/1000000000000000000)
	  console.log(weth_balance)
	} catch (error) {
	  console.log('Looks like there was a problem: ', error);
	}	
}

get_nfts()

var collections = {}
async function get_nfts(){
	// var token_ids = []
	// var offset = 0
	const hidden = ['theapesonsnft', 'babydeluxe', 'doodlebearsdeluxe', 'neneneko-labs', 'larva-lads', 'pandaparadise', 
	'frosty-snowbois', "baycforpeople", 'zoogangnft', 'dirtybird-flight-club', 'ens', 'metaverse-cool-cats', 'larva-eggs', 
	'doomers', 'etherdash', 'minitaurs-reborn', 'trexmafiaog', 'bit-kongz', 'drinkbepis', 'larvadads', 'larva-doods', 'doodlefrensnft'
	, 'flower-friends', 'feelgang', 'doodlebitsnft', 'croodles', 'doodle-apes-society-das', 'doodledogsofficial']
	for(var account in values.default.OWNER_ADDRESS){
		get_weth_balance(values.default.OWNER_ADDRESS[account].address)
		await new Promise(resolve => setTimeout(resolve, 500))
		get_balance(values.default.OWNER_ADDRESS[account].address)
		await new Promise(resolve => setTimeout(resolve, 500))
		console.log(account)
		if(account === 8){
			console.log('waiting')
			await new Promise(resolve => setTimeout(resolve, 60000))
		}
		try {
			const response = await fetch("https://api.etherscan.io/api?module=account&action=tokennfttx&address=" + values.default.OWNER_ADDRESS[account].address + "&startblock=0&endblock=999999999&sort=asc&apikey=" + API_KEY);
			const data = await response.json()
			console.log(data)
			console.log(data.result.length)
			for(var i in data.result){
				//token_ids.push(data.result[i].tokenID)
				const asset = await seaport.api.getAsset({
					tokenAddress: data.result[i].contractAddress,
					tokenId: data.result[i].tokenID,
				})
				if(asset.owner.address.toLowerCase() === values.default.OWNER_ADDRESS[account].address.toLowerCase() && hidden.includes(asset.collection.slug) === false){
					// if(Object.keys(collections).includes(asset.collection.slug)){
					// 	collections[asset.collection.slug].push(asset)
					// } else {
					// 	collections[asset.collection.slug] = [asset]
					// }
					if(collections[asset.collection.slug] === undefined){
						collections[asset.collection.slug] = {}
						collections[asset.collection.slug][asset.tokenId] = asset
					} else {
						if(!(asset.tokenId in collections[asset.collection.slug])){
							collections[asset.collection.slug][asset.tokenId] = asset
						}
					}
				}
			}
			
		} catch (error) {
		  console.log('Looks like there was a problem: ', error);
		}
	}
	display()
}

async function display(){
	var count = 0
	var eth_value = 0
	var divNode = document.getElementById('page')
	while(divNode.firstChild) {
        divNode.removeChild(divNode.firstChild);
    }
	for(const collection in collections){
		try{
			await new Promise(resolve => setTimeout(resolve, 250))
			const collect = await seaport.api.get('/api/v1/collection/' + collection)
			console.log(collect)
			var floor_price = collect['collection']['stats']['floor_price']
			var nodeh3 = document.createElement('h3')
			nodeh3.innerHTML = '<a target=_blank href="https://opensea.io/collection/' + collection + '">' + collection + '</a> FLOOR: ' + floor_price.toFixed(4) + ' ' + collect['collection']['dev_seller_fee_basis_points']/100 + '% One day sales: ' + collect.collection.stats.one_day_sales + ' | average price: ' + collect.collection.stats.one_day_average_price.toFixed(4) + ' '
			nodeh3.style = 'text-align: center'
			divNode.appendChild(nodeh3)
			var hide_button = document.createElement('button')
			hide_button.id = collection + ' button' 
			hide_button.innerHTML = 'Hide'
			hide_button.addEventListener('click', function(){
				if(document.getElementById(this.id.split(' ')[0]).style.display === 'none'){
					document.getElementById(this.id.split(' ')[0]).style.display = ''
					hide_button.innerHTML = 'Hide'
				} else{
					document.getElementById(this.id.split(' ')[0]).style.display = 'none'
					hide_button.innerHTML = 'Show'
				}
			})
			divNode.appendChild(hide_button)
			var nodeflexcontainer = document.createElement('div')
			nodeflexcontainer.className = 'flex-container'
			nodeflexcontainer.id = collection
			for(var asset in collections[collection]){
				eth_value += floor_price
				var asset = collections[collection][asset]
				count += 1
				console.log(asset)

				var nodediv = document.createElement('div')
				nodediv.className = 'flex-item'
				var nodedivtxt = document.createElement('div')
				var nodeimg = document.createElement('img')

				nodeimg.style.width = '150px'
				nodeimg.style.height = '150px'
				nodeimg.src = asset.imageUrl
				try {
					var top_bid = asset.buyOrder[0].basePrice/1000000000000000000
				} catch (e){
					top_bid = 0
				}
				
				var curr_bid = 0

				for(var bid in asset.buyOrders){
	              try{
	                if(asset.buyOrders[bid].makerAccount.user.username === 'DrBurry'){
	                  continue
	                } 
	              }catch(e) {
	                }
	              curr_bid = asset.buyOrders[bid].basePrice/1000000000000000000
	              if(curr_bid > top_bid){
	                top_bid = curr_bid
	              }        
	            }
	            try{
	            	var listed_price = asset.sellOrders[0].basePrice/1000000000000000000
	            }catch(e){
	            	listed_price = '--'
	            	nodediv.style.backgroundcolor = '#e69138'
	            }
	            try{
	            	var last_sale = ' (' + (asset.lastSale.totalPrice/1000000000000000000).toFixed(3) + ')'
	            } catch(e){
	            	last_sale = ' (--)'
	            }
	            var username = asset.owner.user.username
				nodedivtxt.innerHTML = username + '<br>' + '<a target=_blank href=' + asset.openseaLink +'>#' + asset.tokenId + '</a>' + '<br>' + listed_price + last_sale + '<br><span style="color:purple">' + top_bid.toFixed(3) + '<br></span>'
				var input = document.createElement('input')
				var button = document.createElement('button')
				button.id = asset.collection.slug + ' ' + asset.tokenId + ' ' + asset.tokenAddress
				input.id = asset.collection.slug + '' + asset.tokenId
				button.addEventListener('click', function(){	
					sell_order(this.id.split(' '))
				})
				button.innerHTML = '>'
				input.style.width = '50px'
				nodedivtxt.appendChild(input)
				nodedivtxt.appendChild(button)
				nodediv.appendChild(nodeimg)
				nodediv.appendChild(nodedivtxt)

				nodeflexcontainer.appendChild(nodediv)
			}
			divNode.appendChild(nodeflexcontainer)
		} catch (e) {
			console.log(e)
		}
	}
	console.log(eth_value)
	console.log(count)
	providerEngine.start()
}
document.getElementById('refresh').addEventListener('click', display)
document.getElementById('search').addEventListener('input', search)

function search(){
	console.log(document.getElementById('search').value)
	if(Object.keys(collections).includes(document.getElementById('search').value)){
		document.getElementById(document.getElementById('search').value).scrollIntoView();
	} 
}
function hide_all(){
	for(var collection in collections){
		document.getElementById(collection).style.visibility = "hidden"
	}
}
function show_all(){
	for(var collection in collections){
		document.getElementById(collection).style.visibility = "hidden"
	}
}

async function sell_order(item){
	console.log(document.getElementById(item[0]+item[1]).value)
	console.log(item)
	if(document.getElementById(item[0]+item[1]).value !== ''){
		try{
			const auction = await seaport.createSellOrder({
				asset: {
					tokenAddress: item[2], // CryptoKitties
					tokenId: item[1], // Token ID
			    },
				accountAddress: ADDRESS,
				startAmount: document.getElementById(item[0]+item[1]).value,
			})
			console.log(auction)
		} catch(e) {
		console.log(e)
		}
	} else {
		alert('No')
	}

	
}


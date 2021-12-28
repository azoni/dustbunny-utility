const values = {
	TITLE: 'Home',
	DEFAULT_DELAY: 150,
	//DEFAULT_FRACTION: 'firsthalf',
	//DEFAULT_FRACTION: 'secondhalf',
	//DEFAULT_FRACTION: 'firstquarter',
	//DEFAULT_FRACTION: 'secondquarter',
	//DEFAULT_FRACTION: 'thirdquarter',
	//DEFAULT_FRACTION: 'fourthquarter',
	//DEFAULT_FRACTION: 'firsteighth',
	//DEFAULT_FRACTION: 'secondeighth',
	//DEFAULT_FRACTION: 'thirdeighth',
	//DEFAULT_FRACTION: 'fourtheighth',
	//DEFAULT_FRACTION: 'fiftheighth',
	//DEFAULT_FRACTION: 'sixtheighth',
	//DEFAULT_FRACTION: 'seventheighth',
	//DEFAULT_FRACTION: 'eightheighth',
	//MULTI_TRAIT: 1,
	//DEFAULT_BIDS: [.7,.9],
	//DEFAULT_EXPIRATION: ,
	//DEFAULT_TRAIT: ['tier', 'cool_1'],
	//USE_DATA: 1,
	INFURA_KEY: ['deb8c4096c784171b97a21f7a5b7ba98', '4f3eb54f7bf74889898db355ca586eb1', '7e5d8e2034a840b9b8e6093dca13aa4f', '17c3fb8ed16c4ebe890ca3d22ad6998a'],
	//ALCHEMY_KEY: 'KwOeJc6S2vvKtLXEpmo2-SFXOws3uZC3',
	COLLECTION_TRAIT: {
		'cool-cats-nft': {
			'tier': {
				// 'cool_1': [.7,.8],
				// 'cool_2': [.7, .825],
				'wild_1': [.9,.925],
				'wild_2': [1,1.05],
				'classy_1': [1.05 ,1.1],
				'classy_2': [1.1, 1.2],
				'exotic_1': [1.2,1.3],
				'exotic_2': [1.5,1.6],
			},
			'face': {
				'tvface': [1.5, 2],
			},
			'hat': {
				'tvhead': [1.1, 1.2],
				'unicorn': [.925, .93],
				'Knight': [1.1, 1.2],
				'prince': [1.05, 1.1],
				'halo': [1.1, 1.2],
				'halo fire': [1.05, 1.2],
				'horns': [1.05, 1.1],
				'astro': [1, 1.1],
				'admiral': [1.1, 1.2],
				'astro cheeks': [1.2, 1.3],
				'visor purple': [1.2, 1.3],
				'costume gorilla': [1.1, 1.2],
				'dutch': [1.1, 1.2],
				'admiral pink': [1.2, 1.3],
				'crown black': [1.2, 1.3],
				'crown gold': [1.1, 1.2],
				'afro rainbow unicorn': [1.4, 1.6],
				'crown fire': [1.4, 1.6],
				'costume dragon': [1.1, 1.2],
				'costume frog': [1.75, 1.8],
				'astro fishbowl': [1.4, 1.75],
			},
			'shirt': {
				'epaulette': [1.1, 1.2],
				'costume hotdog': [1.05, 1.1],
				'combat': [1.1, 1.15],
				'costume frog': [1.1, 1.2],
				'tiger': [1.2, 1.3],
				'astro black': [1.1, 1.15],
				'astro orange': [1.1, 1.15],
				'mononoke': [1.05, 1.1],
				'deepsea orange': [1.15, 1.2],
				'costume gorilla': [1.2, 1.3],
			},
		},
		'doodles-official': {
			'face': {
				'neutral note': [.8, .925],
				'mad note': [.85, .95],
				'sad note': [.775, .95],
				'skelton': [.95, 1],
				'rainbow puke': [1.5, 2.1],
				'puffer up': [2.5, 3.1],
				'ape': [2.5, 3.1],
				'shark': [2.5, 3],
				'duck': [2.5, 3],
				'skelly cig': [4, 5.1],
				'alien': [3.5, 5.1],
				'dino': [3.5, 5.1],
				'cat': [4, 6.1],
				'holographic visor': [5, 5.1],
				'whale': [4.1, 5.2],
			},
			'body': {
				'blazer': [.9, .95],
				'leopard hoodie': [1.1, 1.2],
				'rainbow striped sweater': [1, 1.1],
				'spotted': [1, 1.1],
				'holographic sweater': [1, 1.1],
			},
			'head': {
				'balloon': [2.25, 2.6],
				'devil': [1.75, 2],
				'pickle': [2, 2.1],
				'flower': [2, 2.1],
				'coffee': [2.75, 3.1],
				'lit': [2, 2.1],
				'rainbow': [2.5, 3.1],
				'popsicle': [2.75, 3.1],
				'icecream': [2.75, 3.1],

			},
			'background': {
				'space': [.9,.925],
				'sky': [.9,.925],
				'fire': [.9,.925],
				// 'holographic': [.8,.925],
				// 'iridescent': [.8,.925],
			},
			'hair': {
				'sailor': [1.1, 1.2],
				'poopie': [1, 1.1],
				'crown': [1.1, 1.2],
				'wizard': [1.1, 1.2],
				'helmet': [.925, .95],
				'holographic crown': [1.2, 2],
			},
			'piercing': {
				'airpod': [.925, .95],
			},
			
		},
		'cryptoadz-by-gremplin': {
			'accessory': {
				'explorer': [1, 1.05],
				'hoodie': [1.5, 2],
			},
			'clothes': {
				'hoodie': [1.5, 1.6],
			},
			'background': {
				'bloood': [1.2, 1.5],
				'ghost crash': [4.5, 6],
				'matrix': [4.5,6],
			},
			'body': {
				'bones': [ 1.05, 1.1],
				'toadenza': [2.5, 3],
				'blood bones': [1.5,1.6],
			},
			'eyes': {
				'nounish': [1.1, 1.5],
				'3d': [.85, .925],
			},
			'head': {
				'wizard': [.925, 1.5],
				'fez': [.9, .95],
				'swept teal': [ 1.2, 1.3],

			},
			'custom': {
				'1/1': [4, 5],
				'licked': [3.5,4],
				'murdered': [2,4],
				'legendary': [3,5],
			},
			
		},
		'cyberkongz': {
			'type': {
				'genesis': [1.5, 5],
				'incubator': [1.05, 1.1],
			},
		},
		'larva-lads': {
			'type': {
				'alien': [22.5, 2, .2],
				'zombie': [7.5, 1.1, .1],
				'ape': [10,2]
			},
		},
		'mutant-ape-yacht-club': {
			'background': {
				'm2': [1.2, 1.3],
			}
		},
	},
	WALLET_SETS: [
		'cool-cats-nft',
		'mutant-ape-yacht-club',
		'cyberkongz',
		'doodles-official',
		'clonex',
		'cryptoadz-by-gremplin',
	],
	WATCH_LIST: ['cyberkongz','cool-cats-nft', 'cryptoadz-by-gremplin',
	 'cyberkongz', 'doodles-official', 'mutant-ape-yacht-club', 
	 'bored-ape-kennel-club', 'desperate-ape-wives', 'bears-deluxe-new',
	 'clonex', 'decentraland', 'sandbox', 'collectvox', 'creatureworld',
	 'meebits', 'guttercatgang', 'veefriends', 'rumble-kong-league',
	 'deadfellaz', 'lazy-lions', 'pudgypenguins', 'forgottenruneswizardscult',
	 'supducks', 'the-doge-pound', 'cyberkongz-vx', 'lootproject'
	 ],
	WATCH_LIST_LOW: ['meebits', 'lootproject'],
	COMP_WALLETS: [//'0x0ecbba0ccb440e0d396456bacdb3ce2a716b96e5',
	'0x3a6ae92bc396f818d87e60b0d3475ebf37b9c2ea', ],
	// '0x701c1a9d3fc47f7949178c99b141c86fac72a1c4',], 
	// '0xfdb32c8ddda21172a031d928056e19725a0836c5', ],
	// '0xdc3b7ef263f1cdaa25ffa93c642639f5f4f2a669', ],
	// '0xadee30341a9e98ed145ccb02b00da15e74e305b5', ],
	// '0x483b71d5b5661c2340273dc1219c4f94dacf5cc8', ],
	// '0x15cba6d3b98d220bc1ecda89afdf07dd0bf06c5d', ],
	// '0xbb2cd2434ca0881bcdcce88f6e77c607fc71c128', ],
	// '0x07b52eac4361f6aa840237e20afe89fe5eb8d031'],
	OWNER_ADDRESS: [
		{
			username: 'DustBunny_1',
			address: '0xb56851362dE0f360E91e5F52eC64d0A1D52E98E6'
		}, 
		{
			username: 'DustBunny_2',
			address: '0x52d809BCd3c631760b1e480b8D3bE13D7eEC0E25'
		}, 
		{
			username: 'DustBunny_3',
			address: '0xfb27e7b963982fb3a955c401f93a0db8042e679e'
		}, 
		{
			username: 'DustBunny_4',
			address: '0xE143d6306C1743280D40e968F48cae36F56fC7d1'
		}, 
		{
			username: 'DustBunny_5',
			address: '0xfCe9DC535364DcBd10e1D8f2F996761ec5eD03aC'
		}, 
		{
			username: 'DustBunny_6',
			address: '0xFB666Bb0Ee1D073a9006865D961AA3C3611685a9'
		}, 
		{
			username: 'DustBunny_7',
			address: '0x5ea09d2E44759C46F8F2a884815B6bD06dcA440F'
		}, 
		{
			username: 'DustBunny_8',
			address: '0x73B2d479691Ea1d932D047149F158AD51249D660'
		}, 
		{
			username: 'DustBunny_9',
			address: '0xC4cF8D37a72463722FDE94A6ac1867E3C482A85c'
		},
		{
			username: 'DustBunny_10',
			address: '0xA6E3Dd05cd995C3D7f4E84917B5292b4D2de4c3E'
		}, 
		{
			username: 'DustBunny_11',
			address: '0xc966380FC69D989E7fA021d2F6F0e3db65F36f59'
		}, 
		{
			username: 'DustBunny_12',
			address: '0x8B3466FFf6F40a366deD61458BCF7EEF043d325c'
		}, 
		{
			username: 'DustBunny_13',
			address: '0x4cc553e8bbbA85DeDe46b997455d23034F70bb32'
		}, 
		{
			username: 'DustBunny_14',
			address: '0x562b209A296E86560a3185dBD5E03Bc095eBc94D'
		}, 
		{
			username: 'DustBunny_15',
			address: '0x036910a9621218447C95805C2dCBc9B3bD1D39d4'
		},
		{
			username: 'DustBunny_16',
			address: '0x8F2D0aFD7a8e444f7e905DE5F09E04e6c382362e'
		}, 
		{
			username: 'DustBunny_17',
			address: '0xd517e2ACDFBBb19BcC3c7069dDDeE2D67Eab4E6c'
		},
		{
			username: 'DustBunny_18',
			address: '0x763be576919a0d32b9e7ebDaF5a858195E04A6Cb'
		}, 
		{
			username: 'DustBunny_19',
			address: '0x4d64bDb86C7B50D8B2935ab399511bA9433A3628'
		},
		{
			username: 'DustBunny_20',
			address: '0x18a73AaEe970AF9A797D944A7B982502E1e71556'
		}, 
				{
			username: 'DustBunny_21',
			address: '0x1AEc9C6912D7Da7a35803f362db5ad38207D4b4A'
		}, 
				{
			username: 'DustBunny_22',
			address: '0x35C25Ff925A61399a3B69e8C95C9487A1d82E7DF'
		}, 
		{
			username: 'DustBunny_23',
			address: '0x67707b8E56b843099d5eF656Bc840D46d1c0e6d4'
		}, 
	],
}
export default values

//9e72715b3e504813ac3ebc0512d473bf
//3e994eb084474893abe7842014dbd66c
//01f5e748ef324524a49ea0bfaecbc3e8
//183e20b9d8f24da3a3bfdc9bcc384ec3
//4b7d65a561134155970501edaa04b5d2
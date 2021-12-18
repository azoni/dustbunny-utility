const values = {
	DEFAULT_DELAY: 150,
	//DEFAULT_FRACTION: 'thirdeighth',
	//DEFAULT_BIDS: [],
	//DEFAULT_EXPIRATION: ,
	//DEFAULT_TRAIT: ,
	INFURA_KEY: ['deb8c4096c784171b97a21f7a5b7ba98', '4f3eb54f7bf74889898db355ca586eb1', '7e5d8e2034a840b9b8e6093dca13aa4f', '17c3fb8ed16c4ebe890ca3d22ad6998a'],
	ALCHEMY_KEY: 'KwOeJc6S2vvKtLXEpmo2-SFXOws3uZC3',
	COLLECTION_TRAIT: {
		'cool-cats-nft': {
			'tier': {
				'cool_1': [.7,.8],
				'cool_2': [.7, .825],
				'wild_1': [.8,.85],
				'wild_2': [.8,.875],
				'classy_1': [.85,.9],
				'classy_2': [.9,.91],
				// 'exotic_1': [1,1.1],
				// 'exotic_2': [1.1,1.2],
			},
		},
		'doodles-official': {
			'face': {
				'neutral note': [.8, .925],
				'mad note': [.8, .95],
				'skelton': [.8, 1],
				'rainbow puke': [1.2, 2],
				'cat': [2, 4],
			},
			'head': {
				'balloon': [1.5, 2],
				'devil': [1.1, 1.5],
			},
			'background': {
				'space': [.8,.925],
				'sky': [.8,.925],
				'fire': [.8,.925],
				'holographic': [.8,.925],
				'iridescent': [.8,.925],
			},
			'hair': {
				'holographic crown': [1.2, 2],
			},
			
		},
		'cryptoadz-by-gremplin': {
			'accessory': {
				'explorer': [1, 1.05],
				'hoodie': [1.5, 2],
				'skelton': [.8, 1],
				'rainbow puke': [1.2, 2],
				'cat': [2, 4],
			},
			'clothes': {
				'hoodie': [1.1, 1.5],
			},
			'background': {
				'bloood': [.95, 1],
				'ghost crash': [2, 3],
				'matrix': [2,3],
			},
			'body': {
				'bones': [ 1.05, 1.1],
				'toadenza': [2, 3],
				'blood bones': [1.25,1.3],
			},
			'eyes': {
				'nounish': [1, 1.5],
				'3d': [.85, .925],
			},
			'head': {
				'wizard': [.925, 1.5],
				'fez': [.9, .95],

			},
			'custom': {
				'1/1': [2, 3],
				'licked': [2,4],
				'murdered': [2,4],
				'legendary': [3,5],
			},
			
		}
	},
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
			username: '0xfB27E7B963982FB3a955c401F93a0Db8042e679e',
			address: '0x13b451d77b87361d376ae211f640ed1a4491181d'
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
			address: '0xB1CbED4ab864e9215206cc88C5F758fda4E01E25'
		}, 
		{
			username: 'DustBunny_17',
			address: '0xB1CbED4ab864e9215206cc88C5F758fda4E01E25'
		},
		{
			username: 'DustBunny_18',
			address: '0xB1CbED4ab864e9215206cc88C5F758fda4E01E25'
		}, 
		{
			username: 'DustBunny_19',
			address: '0xB1CbED4ab864e9215206cc88C5F758fda4E01E25'
		},
		{
			username: 'DustBunny_20',
			address: '0xB1CbED4ab864e9215206cc88C5F758fda4E01E25'
		}, 

	],
	//API_KEY: '2f6f419a083c46de9d83ce3dbe7db601',
	API_KEY: 'bb554633d8a54b8297e34565f64091fe',
	API_KEY2: '',
	//API_KEY2: 'bb554633d8a54b8297e34565f64091fe',
	BLACK_LIST: ['ShoulderPress','OtterPop','nftd00d', 'DustBunny', 'BalloonAnimal', 'E2E017', 'CakeBatter', '74b93017', 'DoughnutHole', 'Sad002d', '801703', 'forbayc'],
	FAVORITES: ['cool-cats-nft','doodles-official'],
	favorites: {
		'bears-deluxe': [6900],
		'galacticapes': [9999],
		'theshiboshis': [9999],
		'kaiju-kingz': [3333],
		'cyberkongz': [4052],
		'treeverse': [10420],
		'metahero-generative': [5754],
		'cool-cats-nft': [9932],
		'world-of-women-nft': [9999],
		'cryptoadz-by-gremplin': [6969],
		'supducks': [9999],
		'spaceapes': [2000],
		////
		'creature-world-collection': [9999],

		//Cheaper
		'mutant-ape-yacht-club': [15671],
		'bored-ape-kennel-club': [9999],	

		//tropical-turtles
	}
}
export default values

//dustbunny123@protonmail.com
//1bac20c89d97488491bad84f22d7a15b
///charlonuw
//9e30b32ca14a408c99ae890ac2c8e8dc
//dustbunny124@protonmail.com
//55b37dd4e48b49cb8c5f9e90445088a1
//dustuw
//231011f146004bd1927eaf77c8b69aac

//"0x0ecbba0ccb440e0d396456bacdb3ce2a716b96e5"
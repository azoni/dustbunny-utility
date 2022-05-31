const { createAlchemyWeb3 } = require('@alch/alchemy-web3');

// eslint-disable-next-line new-cap
const web3 = new createAlchemyWeb3('https://eth-mainnet.alchemyapi.io/KwOeJc6S2vvKtLXEpmo2')
const dooplications_abi = [{ inputs: [{ internalType: 'address', name: 'doodles_', type: 'address' }, { internalType: 'address', name: 'spaceDoodles_', type: 'address' }], stateMutability: 'nonpayable', type: 'constructor' }, { inputs: [], name: 'ApprovalCallerNotOwnerNorApproved', type: 'error' }, { inputs: [], name: 'ApprovalQueryForNonexistentToken', type: 'error' }, { inputs: [], name: 'ApprovalToCurrentOwner', type: 'error' }, { inputs: [], name: 'ApproveToCaller', type: 'error' }, { inputs: [], name: 'BalanceQueryForZeroAddress', type: 'error' }, { inputs: [], name: 'MintToZeroAddress', type: 'error' }, { inputs: [], name: 'MintZeroQuantity', type: 'error' }, { inputs: [], name: 'OwnerQueryForNonexistentToken', type: 'error' }, { inputs: [], name: 'TransferCallerNotOwnerNorApproved', type: 'error' }, { inputs: [], name: 'TransferFromIncorrectOwner', type: 'error' }, { inputs: [], name: 'TransferToNonERC721ReceiverImplementer', type: 'error' }, { inputs: [], name: 'TransferToZeroAddress', type: 'error' }, { inputs: [], name: 'URIQueryForNonexistentToken', type: 'error' }, {
  anonymous: false,
  inputs: [{
    indexed: true, internalType: 'address', name: 'owner', type: 'address',
  }, {
    indexed: true, internalType: 'address', name: 'approved', type: 'address',
  }, {
    indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256',
  }],
  name: 'Approval',
  type: 'event',
}, {
  anonymous: false,
  inputs: [{
    indexed: true, internalType: 'address', name: 'owner', type: 'address',
  }, {
    indexed: true, internalType: 'address', name: 'operator', type: 'address',
  }, {
    indexed: false, internalType: 'bool', name: 'approved', type: 'bool',
  }],
  name: 'ApprovalForAll',
  type: 'event',
}, {
  anonymous: false,
  inputs: [{
    indexed: true, internalType: 'address', name: 'previousOwner', type: 'address',
  }, {
    indexed: true, internalType: 'address', name: 'newOwner', type: 'address',
  }],
  name: 'OwnershipTransferred',
  type: 'event',
}, {
  anonymous: false,
  inputs: [{
    indexed: true, internalType: 'bytes32', name: 'role', type: 'bytes32',
  }, {
    indexed: true, internalType: 'bytes32', name: 'previousAdminRole', type: 'bytes32',
  }, {
    indexed: true, internalType: 'bytes32', name: 'newAdminRole', type: 'bytes32',
  }],
  name: 'RoleAdminChanged',
  type: 'event',
}, {
  anonymous: false,
  inputs: [{
    indexed: true, internalType: 'bytes32', name: 'role', type: 'bytes32',
  }, {
    indexed: true, internalType: 'address', name: 'account', type: 'address',
  }, {
    indexed: true, internalType: 'address', name: 'sender', type: 'address',
  }],
  name: 'RoleGranted',
  type: 'event',
}, {
  anonymous: false,
  inputs: [{
    indexed: true, internalType: 'bytes32', name: 'role', type: 'bytes32',
  }, {
    indexed: true, internalType: 'address', name: 'account', type: 'address',
  }, {
    indexed: true, internalType: 'address', name: 'sender', type: 'address',
  }],
  name: 'RoleRevoked',
  type: 'event',
}, {
  anonymous: false,
  inputs: [{
    indexed: true, internalType: 'address', name: 'from', type: 'address',
  }, {
    indexed: true, internalType: 'address', name: 'to', type: 'address',
  }, {
    indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256',
  }],
  name: 'Transfer',
  type: 'event',
}, {
  inputs: [], name: 'DEFAULT_ADMIN_ROLE', outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }], stateMutability: 'view', type: 'function',
}, {
  inputs: [], name: 'SUPPORT_ROLE', outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }], stateMutability: 'view', type: 'function',
}, {
  inputs: [{ internalType: 'address', name: 'to', type: 'address' }, { internalType: 'uint256', name: 'tokenId', type: 'uint256' }], name: 'approve', outputs: [], stateMutability: 'nonpayable', type: 'function',
}, {
  inputs: [{ internalType: 'address', name: 'owner', type: 'address' }], name: 'balanceOf', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function',
}, {
  inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }], name: 'burn', outputs: [], stateMutability: 'nonpayable', type: 'function',
}, {
  inputs: [], name: 'claim', outputs: [], stateMutability: 'nonpayable', type: 'function',
}, {
  inputs: [], name: 'claimActive', outputs: [{ internalType: 'bool', name: '', type: 'bool' }], stateMutability: 'view', type: 'function',
}, {
  inputs: [], name: 'deleteDefaultRoyalty', outputs: [], stateMutability: 'nonpayable', type: 'function',
}, {
  inputs: [], name: 'doodles', outputs: [{ internalType: 'contract IERC721Enumerable', name: '', type: 'address' }], stateMutability: 'view', type: 'function',
}, {
  inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }], name: 'getApproved', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function',
}, {
  inputs: [{ internalType: 'bytes32', name: 'role', type: 'bytes32' }], name: 'getRoleAdmin', outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }], stateMutability: 'view', type: 'function',
}, {
  inputs: [{ internalType: 'bytes32', name: 'role', type: 'bytes32' }, { internalType: 'address', name: 'account', type: 'address' }], name: 'grantRole', outputs: [], stateMutability: 'nonpayable', type: 'function',
}, {
  inputs: [{ internalType: 'bytes32', name: 'role', type: 'bytes32' }, { internalType: 'address', name: 'account', type: 'address' }], name: 'hasRole', outputs: [{ internalType: 'bool', name: '', type: 'bool' }], stateMutability: 'view', type: 'function',
}, {
  inputs: [{ internalType: 'address', name: 'owner', type: 'address' }, { internalType: 'address', name: 'operator', type: 'address' }], name: 'isApprovedForAll', outputs: [{ internalType: 'bool', name: '', type: 'bool' }], stateMutability: 'view', type: 'function',
}, {
  inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }], name: 'isClaimed', outputs: [{ internalType: 'bool', name: '', type: 'bool' }], stateMutability: 'view', type: 'function',
}, {
  inputs: [], name: 'name', outputs: [{ internalType: 'string', name: '', type: 'string' }], stateMutability: 'view', type: 'function',
}, {
  inputs: [], name: 'owner', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function',
}, {
  inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }], name: 'ownerOf', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function',
}, {
  inputs: [], name: 'provenance', outputs: [{ internalType: 'string', name: '', type: 'string' }], stateMutability: 'view', type: 'function',
}, {
  inputs: [], name: 'renounceOwnership', outputs: [], stateMutability: 'nonpayable', type: 'function',
}, {
  inputs: [{ internalType: 'bytes32', name: 'role', type: 'bytes32' }, { internalType: 'address', name: 'account', type: 'address' }], name: 'renounceRole', outputs: [], stateMutability: 'nonpayable', type: 'function',
}, {
  inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }], name: 'resetTokenRoyalty', outputs: [], stateMutability: 'nonpayable', type: 'function',
}, {
  inputs: [{ internalType: 'bytes32', name: 'role', type: 'bytes32' }, { internalType: 'address', name: 'account', type: 'address' }], name: 'revokeRole', outputs: [], stateMutability: 'nonpayable', type: 'function',
}, {
  inputs: [{ internalType: 'uint256', name: '_tokenId', type: 'uint256' }, { internalType: 'uint256', name: '_salePrice', type: 'uint256' }], name: 'royaltyInfo', outputs: [{ internalType: 'address', name: '', type: 'address' }, { internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function',
}, {
  inputs: [{ internalType: 'address', name: 'from', type: 'address' }, { internalType: 'address', name: 'to', type: 'address' }, { internalType: 'uint256', name: 'tokenId', type: 'uint256' }], name: 'safeTransferFrom', outputs: [], stateMutability: 'nonpayable', type: 'function',
}, {
  inputs: [{ internalType: 'address', name: 'from', type: 'address' }, { internalType: 'address', name: 'to', type: 'address' }, { internalType: 'uint256', name: 'tokenId', type: 'uint256' }, { internalType: 'bytes', name: '_data', type: 'bytes' }], name: 'safeTransferFrom', outputs: [], stateMutability: 'nonpayable', type: 'function',
}, {
  inputs: [{ internalType: 'address', name: 'operator', type: 'address' }, { internalType: 'bool', name: 'approved', type: 'bool' }], name: 'setApprovalForAll', outputs: [], stateMutability: 'nonpayable', type: 'function',
}, {
  inputs: [{ internalType: 'string', name: 'baseURI_', type: 'string' }], name: 'setBaseURI', outputs: [], stateMutability: 'nonpayable', type: 'function',
}, {
  inputs: [{ internalType: 'bool', name: 'claimActive_', type: 'bool' }], name: 'setClaimActive', outputs: [], stateMutability: 'nonpayable', type: 'function',
}, {
  inputs: [{ internalType: 'address', name: 'receiver', type: 'address' }, { internalType: 'uint96', name: 'feeNumerator', type: 'uint96' }], name: 'setDefaultRoyalty', outputs: [], stateMutability: 'nonpayable', type: 'function',
}, {
  inputs: [{ internalType: 'string', name: 'provenance_', type: 'string' }], name: 'setProvenance', outputs: [], stateMutability: 'nonpayable', type: 'function',
}, {
  inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }, { internalType: 'address', name: 'receiver', type: 'address' }, { internalType: 'uint96', name: 'feeNumerator', type: 'uint96' }], name: 'setTokenRoyalty', outputs: [], stateMutability: 'nonpayable', type: 'function',
}, {
  inputs: [], name: 'spaceDoodles', outputs: [{ internalType: 'contract IERC721Enumerable', name: '', type: 'address' }], stateMutability: 'view', type: 'function',
}, {
  inputs: [{ internalType: 'bytes4', name: 'interfaceId', type: 'bytes4' }], name: 'supportsInterface', outputs: [{ internalType: 'bool', name: '', type: 'bool' }], stateMutability: 'view', type: 'function',
}, {
  inputs: [], name: 'symbol', outputs: [{ internalType: 'string', name: '', type: 'string' }], stateMutability: 'view', type: 'function',
}, {
  inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }], name: 'tokenURI', outputs: [{ internalType: 'string', name: '', type: 'string' }], stateMutability: 'view', type: 'function',
}, {
  inputs: [], name: 'totalSupply', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function',
}, {
  inputs: [{ internalType: 'address', name: 'from', type: 'address' }, { internalType: 'address', name: 'to', type: 'address' }, { internalType: 'uint256', name: 'tokenId', type: 'uint256' }], name: 'transferFrom', outputs: [], stateMutability: 'nonpayable', type: 'function',
}, {
  inputs: [{ internalType: 'address', name: 'newOwner', type: 'address' }], name: 'transferOwnership', outputs: [], stateMutability: 'nonpayable', type: 'function',
}]

const dooplicator = new web3.eth.Contract(dooplications_abi, '0x466cfcd0525189b573e794f554b8a751279213ac')
dooplicator.methods.tokenURI().call((err, res) => {
  if (err) {
    console.log('An error occured', err)
    return
  }
  console.log('Claim: ', res)
})
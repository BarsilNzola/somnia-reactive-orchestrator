import { ethers } from 'ethers';

const abi = [
  'function rebalanceStrategy() external',
  'function pauseStaking() external',
  'function resumeStaking() external',
  'function updateRewardRate(uint256) external',
];

const iface = new ethers.Interface(abi);

console.log('pauseStaking:      ', iface.getFunction('pauseStaking')?.selector);
console.log('resumeStaking:     ', iface.getFunction('resumeStaking')?.selector);
console.log('rebalanceStrategy: ', iface.getFunction('rebalanceStrategy')?.selector);
console.log('updateRewardRate:  ', iface.getFunction('updateRewardRate')?.selector);
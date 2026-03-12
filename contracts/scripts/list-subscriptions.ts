import * as dotenv from 'dotenv';
dotenv.config();

import { ethers } from 'ethers';

const RPC_URL = 'https://dream-rpc.somnia.network';
const PRECOMPILE = '0x0000000000000000000000000000000000000100';
const NEW_ORCHESTRATOR = '0x8bDE5c362015e046Ff4D5640074cC65f40Fc16FE';

const PRECOMPILE_ABI = [
  'function getSubscriptionInfo(uint256 subscriptionId) external view returns (tuple(bytes32[4] eventTopics, address origin, address caller, address emitter, address handlerContractAddress, bytes4 handlerFunctionSelector, uint64 priorityFeePerGas, uint64 maxFeePerGas, uint64 gasLimit, bool isGuaranteed, bool isCoalesced) subscriptionData, address owner)',
  'event SubscriptionCreated(uint256 indexed subscriptionId, address indexed owner, tuple(bytes32[4] eventTopics, address origin, address caller, address emitter, address handlerContractAddress, bytes4 handlerFunctionSelector, uint64 priorityFeePerGas, uint64 maxFeePerGas, uint64 gasLimit, bool isGuaranteed, bool isCoalesced) subscriptionData)',
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const precompile = new ethers.Contract(PRECOMPILE, PRECOMPILE_ABI, provider);

  const rawKey = process.env.PRIVATE_KEY as string;
  const privateKey = rawKey.startsWith('0x') ? rawKey : '0x' + rawKey;
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log('Wallet:', wallet.address);
  console.log('New orchestrator:', NEW_ORCHESTRATOR);
  console.log('');

  // Only search last 1000 blocks (RPC limit)
  const latest = await provider.getBlockNumber();
  const fromBlock = latest - 999;
  const filter = precompile.filters.SubscriptionCreated(null, wallet.address);
  const events = await precompile.queryFilter(filter, fromBlock, latest);

  console.log(`Found ${events.length} subscription(s) created by your wallet:\n`);

  for (const event of events) {
    const e = event as ethers.EventLog;
    const subId = e.args[0];
    const data = e.args[2];
    console.log(`Sub ID: ${subId}`);
    console.log(`  handler:   ${data.handlerContractAddress}`);
    console.log(`  emitter:   ${data.emitter}`);
    console.log(`  gasLimit:  ${data.gasLimit}`);
    console.log(`  topic[0]:  ${data.eventTopics[0]}`);
    console.log(`  points to new orchestrator: ${data.handlerContractAddress.toLowerCase() === NEW_ORCHESTRATOR.toLowerCase()}`);
    console.log('');
  }
}

main().catch(e => {
  console.error('Error:', e.message || e);
  process.exitCode = 1;
});
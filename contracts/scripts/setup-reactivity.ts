/**
 * setup-reactivity.ts
 * 
 * Creates the Somnia Reactivity subscription linking LiquidityPool events
 * to the ReactiveOrchestrator.
 * 
 * NOTE: addAllowedCaller is NOT needed — the deployment script transferred
 * StakingManager ownership to the Orchestrator, so it can call it directly.
 * 
 * Usage:
 *   cd contracts
 *   npx ts-node scripts/setup-reactivity.ts
 * 
 * Requirements:
 *   - PRIVATE_KEY in .env (without 0x prefix, same as used for deployment)
 *   - Wallet needs sufficient SOM for gas
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { SDK } from '@somnia-chain/reactivity';
import { privateKeyToAccount } from 'viem/accounts';
import { createPublicClient, createWalletClient, http, keccak256, toBytes, parseGwei, defineChain } from 'viem';

const LIQUIDITY_POOL = '0x6B0E391571c6144F7486e6fAdFA3450ad5132dC7';
const ORCHESTRATOR   = '0xb6229de9121d4ed8dF075B534DBCA8FB946A40B4';
const RPC_URL        = 'https://dream-rpc.somnia.network';

const somniaTestnet = defineChain({
  id: 50312,
  name: 'Somnia Testnet',
  network: 'somnia-testnet',
  nativeCurrency: { name: 'STT', symbol: 'STT', decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
});

async function main() {
  if (!process.env.PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY not set in .env');
  }

  // Normalize key — works with or without 0x prefix
  const rawKey = process.env.PRIVATE_KEY as string;
  const privateKey = (rawKey.startsWith('0x') ? rawKey : '0x' + rawKey) as `0x${string}`;
  const account = privateKeyToAccount(privateKey);
  console.log('Using wallet:', account.address);

  const publicClient = createPublicClient({
    chain: somniaTestnet,
    transport: http(),
  });

  const walletClient = createWalletClient({
    account,
    chain: somniaTestnet,
    transport: http(),
  });

  const sdk = new SDK({
    public: publicClient,
    wallet: walletClient,
  });

  // ── Subscribe to ALL 3 events that have registered rules ──────────────────
  // Rule 0: LiquidityUpdated → pauseStaking
  // Rule 1: OraclePriceUpdated → rebalanceStrategy  
  // Rule 2: APYUpdated → updateRewardRate

  const eventsToSubscribe = [
    { name: 'LiquidityUpdated',    sig: 'LiquidityUpdated(uint256,uint256)' },
    { name: 'OraclePriceUpdated',  sig: 'OraclePriceUpdated(uint256,uint256)' },
    { name: 'APYUpdated',          sig: 'APYUpdated(uint256,uint256)' },
  ];

  for (const event of eventsToSubscribe) {
    console.log(`\n━━━ Creating subscription for ${event.name} ━━━`);

    const eventTopic = keccak256(toBytes(event.sig));
    console.log('Topic:', eventTopic);

    const txHash = await sdk.createSoliditySubscription({
      handlerContractAddress: ORCHESTRATOR as `0x${string}`,
      emitter: LIQUIDITY_POOL as `0x${string}`,
      eventTopics: [eventTopic],
      priorityFeePerGas: parseGwei('2'),
      maxFeePerGas: parseGwei('10'),
      gasLimit: 2_000_000n,
      isGuaranteed: true,
      isCoalesced: false,
    });

    if (txHash instanceof Error) {
      console.error(`✗ Failed for ${event.name}:`, txHash.message);
      continue;
    }

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    console.log(`✓ ${event.name} subscription created! Block: ${receipt.blockNumber}`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 All subscriptions created! Reactive flow is live:');
  console.log('');
  console.log('   LiquidityPool emits event');
  console.log('         ↓  (Somnia Reactivity)');
  console.log('   ReactiveOrchestrator._onEvent() fires');
  console.log('         ↓  (matching rule found)');
  console.log('   StakingManager action executes');
  console.log('');
  console.log('👉 Open dashboard → hit any trigger button');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main().catch((err) => {
  console.error('\n✗ Error:', err.message || err);
  process.exitCode = 1;
});
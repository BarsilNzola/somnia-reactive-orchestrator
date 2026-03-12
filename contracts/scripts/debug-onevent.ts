/**
 * debug-onevent.ts
 * Calls testTriggerEvent() directly on the orchestrator to debug _onEvent
 * Usage: npx ts-node scripts/debug-onevent.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { ethers } from 'ethers';

const ORCHESTRATOR  = '0xb6229de9121d4ed8dF075B534DBCA8FB946A40B4';
const LIQUIDITY_POOL = '0x6B0E391571c6144F7486e6fAdFA3450ad5132dC7';
const STAKING_MANAGER = '0xc6E7bfD16F4e7a3830B02D0DAfD3FA5145Bd3fA1';
const RPC_URL = 'https://dream-rpc.somnia.network';

const ORCHESTRATOR_ABI = [
  'function testTriggerEvent(address emitter, bytes32[] calldata eventTopics, bytes calldata data) external',
  'function getNextRuleId() external view returns (uint256)',
  'function getRule(uint256 ruleId) external view returns (tuple(address source, bytes4 eventSig, uint256 threshold, address target, bytes callData, bool active, uint256 createdAt))',
  'function getExecutionLogs(uint256 ruleId) external view returns (tuple(uint256 ruleId, uint256 timestamp, bool success, bytes returnData, uint256 gasUsed)[])',
  'function owner() external view returns (address)',
];

const STAKING_ABI = [
  'function owner() external view returns (address)',
  'function allowedCallers(address) external view returns (bool)',
  'function rebalanceStrategy() external',
];

async function main() {
  const rawKey = process.env.PRIVATE_KEY as string;
  const privateKey = rawKey.startsWith('0x') ? rawKey : '0x' + rawKey;
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(privateKey, provider);

  console.log('Wallet:', signer.address);
  console.log('');

  const orchestrator = new ethers.Contract(ORCHESTRATOR, ORCHESTRATOR_ABI, signer);
  const stakingManager = new ethers.Contract(STAKING_MANAGER, STAKING_ABI, signer);

  // ── 1. Print all rules ────────────────────────────────────────────────────
  console.log('━━━ Registered Rules ━━━');
  const nextId = await orchestrator.getNextRuleId();
  for (let i = 0; i < Number(nextId); i++) {
    const rule = await orchestrator.getRule(i);
    console.log(`Rule ${i}:`);
    console.log(`  source:    ${rule.source}`);
    console.log(`  eventSig:  ${rule.eventSig}`);
    console.log(`  threshold: ${ethers.formatEther(rule.threshold)} SOM`);
    console.log(`  target:    ${rule.target}`);
    console.log(`  callData:  ${rule.callData}`);
    console.log(`  active:    ${rule.active}`);
  }

  // ── 2. Print StakingManager auth state ───────────────────────────────────
  console.log('\n━━━ StakingManager Auth ━━━');
  const smOwner = await stakingManager.owner();
  const isAllowed = await stakingManager.allowedCallers(ORCHESTRATOR);
  console.log('SM owner:           ', smOwner);
  console.log('Orchestrator is owner:', smOwner.toLowerCase() === ORCHESTRATOR.toLowerCase());
  console.log('allowedCallers[orch]:', isAllowed);

  // ── 3. Try calling rebalanceStrategy directly ─────────────────────────────
  console.log('\n━━━ Direct rebalanceStrategy() call ━━━');
  try {
    const tx = await stakingManager.rebalanceStrategy();
    await tx.wait();
    console.log('✓ rebalanceStrategy() succeeded from deployer wallet');
  } catch (e: any) {
    console.log('✗ rebalanceStrategy() failed:', e.reason || e.message);
  }

  // ── 4. Simulate testTriggerEvent with static call first ──────────────────
  console.log('\n━━━ Simulating _onEvent (static call) ━━━');
  // Construct fake OraclePriceUpdated event — price = 5 SOM (below all thresholds)
  const EVENT_SIG_FULL = '0x7bb53a16f0a956ec70e3aba1c9dcdd953de741292a17f213b0d38d24d6f476ba';
  const fakePrice = ethers.parseEther('5'); // 5 SOM
  const topic1 = ethers.zeroPadValue(ethers.toBeHex(fakePrice), 32);
  const eventTopics = [EVENT_SIG_FULL, topic1];
  const data = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [fakePrice]);

  try {
    await orchestrator.testTriggerEvent.staticCall(LIQUIDITY_POOL, eventTopics, data);
    console.log('✓ Static call succeeded — _onEvent should work');
  } catch (e: any) {
    console.log('✗ Static call failed:', e.reason || e.message || e);
  }

  // ── 5. Send real testTriggerEvent tx ─────────────────────────────────────
  console.log('\n━━━ Sending testTriggerEvent() tx ━━━');
  try {
    const tx = await orchestrator.testTriggerEvent(LIQUIDITY_POOL, eventTopics, data);
    console.log('Tx hash:', tx.hash);
    const receipt = await tx.wait();
    console.log('Status:', receipt?.status === 1 ? '✓ SUCCESS' : '✗ FAILED');
    console.log('Logs:', receipt?.logs.length, 'events emitted');

    // Check execution logs after
    console.log('\n━━━ Execution Logs After ━━━');
    for (let i = 0; i < Number(nextId); i++) {
      const logs = await orchestrator.getExecutionLogs(i);
      if (logs.length > 0) {
        const last = logs[logs.length - 1];
        console.log(`Rule ${i} last execution:`);
        console.log(`  success:    ${last.success}`);
        console.log(`  gasUsed:    ${last.gasUsed}`);
        console.log(`  returnData: ${last.returnData}`);
        if (!last.success && last.returnData !== '0x') {
          try {
            const reason = ethers.toUtf8String('0x' + last.returnData.slice(10));
            console.log(`  revert msg: ${reason}`);
          } catch {}
        }
      }
    }
  } catch (e: any) {
    console.log('✗ tx failed:', e.reason || e.message);
  }
}

main().catch(e => {
  console.error('Error:', e.message || e);
  process.exitCode = 1;
});
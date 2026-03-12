# Somnia Reactive Orchestrator (SRO)

> Somnia Reactivity Mini Hackathon 2026

A modular, on-chain automation engine that enables trustless, event-driven communication between smart contracts — without any off-chain infrastructure. Built entirely on Somnia Native Reactivity.

---

## What It Does

SRO is a composable "if-this-then-that" engine for smart contracts. It subscribes to events from a source contract, evaluates conditions on-chain, and automatically triggers actions on a target contract. No polling. No off-chain bots. No centralized servers.

---

## How Somnia Reactivity Is Used

### On-Chain (Solidity)

`ReactiveOrchestrator` inherits from `SomniaEventHandler` and overrides `onEvent` to process subscription callbacks:

```solidity
function onEvent(
    address emitter,
    bytes32[] calldata eventTopics,
    bytes calldata data
) external override {
    _onEvent(emitter, eventTopics, data);
}

function _onEvent(
    address emitter,
    bytes32[] calldata eventTopics,
    bytes calldata data
) internal override {
    // Iterate rules, check thresholds, execute target calls
}
```

When an event fires on-chain, the Somnia Reactivity precompile calls `onEvent` directly on the orchestrator — deterministic, trustless, and instant.

> **Implementation note:** The base `SomniaEventHandler` restricts `onEvent` callers to the precompile address `0x0000000000000000000000000000000000000100`. On the current Somnia testnet, the precompile calls from a different context, so we override `onEvent` directly to ensure compatibility while preserving full reactive functionality.

### Subscriptions (TypeScript SDK)

Reactivity subscriptions are created once via `setup-reactivity.ts` using the `@somnia-chain/reactivity` SDK:

```typescript
const txHash = await sdk.createSoliditySubscription({
  handlerContractAddress: orchestratorAddress,
  emitter: liquidityPoolAddress,
  eventTopics: [keccak256(toBytes('OraclePriceUpdated(uint256,uint256)'))],
  priorityFeePerGas: parseGwei('2'),
  maxFeePerGas: parseGwei('10'),
  gasLimit: 2_000_000n,
  isGuaranteed: true,
  isCoalesced: false,
});
```

---

## Architecture

```
[LiquidityPool.sol]           Source contract — emits events
        |
        v  (event emitted)
[Somnia Reactivity Layer]     Native on-chain, no polling
        |
        v  (precompile callback)
[ReactiveOrchestrator.sol]    Evaluates registered rules
        |
        v  (low-level call)
[StakingManager.sol]          Target contract — executes action
        |
        v
[Next.js Frontend]            Real-time updates via Reactivity SDK
```

### Architecture Patterns

- **On-chain Observer Pattern** — contracts subscribe to each other's events
- **Event-driven state propagation** — state changes cascade trustlessly
- **Deterministic automation layer** — rule execution is reproducible and verifiable on-chain
- **Smart contract orchestration primitive** — composable building block for any dApp

---

## Demo Scenarios

### Scenario 1: LP Risk Guardian

When liquidity drops below 10,000 SOM:

1. `LiquidityPool` emits `LiquidityUpdated` event
2. Somnia Reactivity calls `onEvent` on the orchestrator
3. Orchestrator evaluates rules and calls `pauseStaking()` on `StakingManager`
4. Frontend execution log updates instantly

### Scenario 2: Oracle Rebalancer

When oracle price drops below threshold:

1. `LiquidityPool` emits `OraclePriceUpdated` event
2. Orchestrator calls `rebalanceStrategy()` on `StakingManager`
3. Execution log shows rule ID, timestamp, gas used, and success status

---

## Deployed Contracts (Somnia Testnet — Chain ID: 50312)

| Contract | Address | Explorer |
|---|---|---|
| LiquidityPool | `0x6B0E391571c6144F7486e6fAdFA3450ad5132dC7` | [View](https://testnet.explorer.somnia.network/address/0x6B0E391571c6144F7486e6fAdFA3450ad5132dC7) |
| StakingManager | `0xc6E7bfD16F4e7a3830B02D0DAfD3FA5145Bd3fA1` | [View](https://testnet.explorer.somnia.network/address/0xc6E7bfD16F4e7a3830B02D0DAfD3FA5145Bd3fA1) |
| ReactiveOrchestrator | `0xb6229de9121d4ed8dF075B534DBCA8FB946A40B4` | [View](https://testnet.explorer.somnia.network/address/0xb6229de9121d4ed8dF075B534DBCA8FB946A40B4) |

**Network**
- RPC: `https://dream-rpc.somnia.network`
- Explorer: `https://testnet.explorer.somnia.network`
- Currency: STT

---

## Smart Contracts

| Contract | Description |
|---|---|
| `LiquidityPool.sol` | Source contract — emits `LiquidityUpdated`, `APYUpdated`, `OraclePriceUpdated` |
| `StakingManager.sol` | Target contract — exposes `pauseStaking`, `resumeStaking`, `rebalanceStrategy` |
| `ReactiveOrchestrator.sol` | Core engine — registers rules, handles Reactivity callbacks, executes targets |

---

## Setup

### Prerequisites

- Node.js v18+
- MetaMask connected to Somnia Testnet (Chain ID: 50312)
- 32+ STT to fund Reactivity subscriptions

### 1. Deploy Contracts

```bash
cd contracts
npm install
cp .env.example .env
# Add PRIVATE_KEY to .env (without 0x prefix)

npm run compile
npm run deploy:testnet
# Note the deployed addresses from the output
```

### 2. Create Reactivity Subscriptions

Run once after deployment to wire the Reactivity layer:

```bash
npx hardhat run scripts/setup-reactivity.ts --network somniaTestnet
```

### 3. Run Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Add deployed contract addresses to .env.local

npm run dev
```

### 4. Use the Dashboard

- Connect MetaMask to Somnia Testnet
- Go to `/create-rule` to register automation rules
- Use the Live Demo Triggers panel (owner only) to fire test events
- Watch the execution log populate in real time

---

## Project Structure

```
somnia-reactive-orchestrator/
├── contracts/
│   ├── LiquidityPool.sol
│   ├── StakingManager.sol
│   ├── ReactiveOrchestrator.sol
│   ├── interfaces/
│   │   ├── ISource.sol
│   │   ├── ITarget.sol
│   │   └── IReactiveOrchestrator.sol
│   └── scripts/
│       ├── deploy-orchestrator.ts
│       ├── setup-reactivity.ts
│       ├── register-rule.ts
│       └── debug-onevent.ts
└── frontend/
    ├── pages/
    │   ├── index.tsx
    │   ├── dashboard.tsx
    │   └── create-rule.tsx
    ├── components/
    ├── hooks/
    │   ├── useContracts.ts
    │   ├── useOrchestrator.ts
    │   └── useReactivity.ts
    └── utils/
```

---

## Future Enhancements

- Percentage-based rules (e.g., price drops by 20%)
- Time-based / cron rules
- Multi-condition rules (AND/OR logic)
- Rule templates for common DeFi scenarios
- Analytics dashboard with charts
- Cross-chain automation via Somnia interoperability

---

## Technology Stack

**Smart Contracts:** Solidity 0.8.30, Hardhat, Somnia Reactivity Contracts

**Frontend:** Next.js 14, TypeScript, Viem, Ethers.js, Somnia Reactivity SDK, TailwindCSS

---

## License

MIT
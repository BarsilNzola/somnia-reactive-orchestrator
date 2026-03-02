Somnia Reactive Orchestrator (SRO)
==================================

On-Chain Automation Engine Powered by Somnia Native Reactivity
--------------------------------------------------------------

📋 Overview
-----------

The Somnia Reactive Orchestrator is a modular, on-chain automation engine that enables trustless, event-driven communication between smart contracts without any off-chain infrastructure. It leverages Somnia's native reactivity to create an "if-this-then-that" (IFTTT) system for the blockchain.

### Key Features

-   **Event-Driven Automation**: Subscribe to events from any contract and automatically trigger actions

-   **No Off-Chain Infrastructure**: No polling, no bots, no centralized servers

-   **Rule-Based Engine**: Create custom rules with thresholds and conditions

-   **Real-Time Frontend Updates**: Instant UI updates via Somnia Reactivity SDK

-   **Execution Logging**: Full on-chain history of all automated actions

-   **Composable Architecture**: Any contract can be a source or target

🏗 Architecture
---------------

text

[Source Contract]
 │
 ▼ (emits event)
[Somnia Reactivity Layer]
 │
 ▼ (native subscription)
[Reactive Orchestrator]
 │
 ▼ (evaluates rules)
[Target Contract]
 │
 ▼ (state change)
[Frontend UI] (instant updates)

### Core Components

1.  **Source Contract**: Emits observable events (e.g., LiquidityPool)

2.  **Reactive Orchestrator**: Core engine that manages rules and triggers actions

3.  **Target Contract**: Executes automated actions (e.g., StakingManager)

4.  **Frontend Dashboard**: Real-time monitoring and rule management

🚀 Demo Scenario
----------------

### Liquidity Risk Guardian

When liquidity drops below 10,000 SOM:

1.  LiquidityPool emits `LiquidityUpdated` event

2.  Orchestrator detects event and evaluates rules

3.  Automatically calls `pauseStaking()` on StakingManager

4.  Frontend updates instantly: "⚠ Staking paused due to liquidity risk"

### Oracle Rebalance

When price drops 20%:

1.  Oracle price update event triggers

2.  Orchestrator calls `rebalanceStrategy()`

3.  Frontend shows execution log with timestamp and gas used

🛠 Technology Stack
-------------------

### Smart Contracts

-   **Solidity** ^0.8.19

-   **Somnia Reactivity Contracts** - Native event handling

-   **Hardhat** - Development environment

-   **TypeChain** - Type-safe contract interactions

### Frontend

-   **Next.js 14** - React framework

-   **TypeScript** - Type safety

-   **Wagmi** - Ethereum wallet integration

-   **Viem** - Low-level Ethereum interaction

-   **Somnia Reactivity SDK** - Real-time subscriptions

-   **TailwindCSS** - Styling

📦 Installation
---------------

### Prerequisites

-   Node.js v18+

-   npm or yarn

-   MetaMask wallet

-   Somnia Testnet access

### Clone the Repository

bash

git clone https://github.com/BarsilNzola/somnia-reactive-orchestrator.git
cd somnia-reactive-orchestrator

### Smart Contracts Setup

bash

cd contracts
npm install
cp .env.example .env
# Add your private key and RPC URLs to .env

# Compile contracts
npm run compile

# Run tests
npm run test

# Deploy to Somnia Testnet
npm run deploy:testnet

### Frontend Setup

bash

cd frontend
npm install
cp .env.example .env.local
# Add your contract addresses to .env.local

# Copy ABIs from contracts
npm run copy-abis

# Build and run
npm run build
npm run dev

📁 Project Structure
--------------------

text

somnia-reactive-orchestrator/
├── contracts/                    # Smart contracts
│   ├── contracts/
│   │   ├── interfaces/           # Contract interfaces
│   │   ├── orchestrator/         # ReactiveOrchestrator.sol
│   │   ├── sources/               # LiquidityPool.sol
│   │   └── targets/               # StakingManager.sol
│   ├── scripts/                   # Deployment scripts
│   ├── test/                      # Test files
│   └── hardhat.config.ts          # Hardhat configuration
│
├── frontend/                      # Next.js frontend
│   ├── pages/                      # Next.js pages
│   ├── components/                  # React components
│   ├── hooks/                       # Custom React hooks
│   ├── utils/                       # Utilities and constants
│   ├── abis/                        # Contract ABIs (copied)
│   └── public/                      # Static assets
│
├── deployment.json                  # Deployed contract addresses
└── README.md                        # This file

💡 Usage
--------

### 1\. Connect Wallet

-   Ensure MetaMask is connected to Somnia Testnet (Chain ID: 50342)

-   Get test SOM tokens from the faucet

### 2\. Create a Rule

Navigate to `/create-rule` and fill in:

-   **Source Event**: Select from available events (LiquidityUpdated, APYUpdated, OraclePriceUpdated)

-   **Threshold Value**: Set the condition (e.g., 10,000 SOM for liquidity)

-   **Target Action**: Choose what to trigger (pauseStaking, rebalanceStrategy, etc.)

-   **Action Parameters**: Provide any required parameters

### 3\. Monitor Dashboard

The dashboard shows:

-   **Contract States**: Real-time values from source and target contracts

-   **Active Rules**: List of all registered rules with their status

-   **Execution History**: Log of all automated actions with success/failure status

### 4\. Deactivate Rules

-   Toggle rules on/off from the dashboard

-   Deactivated rules won't trigger even if conditions are met

🧪 Testing
----------

bash

cd contracts
npm run test          # Run all tests
npm run test:gas      # Run tests with gas reporting
npm run coverage      # Generate test coverage report

🌐 Network Configuration
------------------------

### Somnia Testnet

-   **Chain ID**: 50342

-   **RPC URL**: <https://testnet.rpc.somnia.network>

-   **Explorer**: <https://testnet.explorer.somnia.network>

-   **Currency**: SOM

📊 Architecture Pattern
-----------------------

The Somnia Reactive Orchestrator implements:

-   **On-chain Observer Pattern**: Contracts observe and react to events

-   **Event-driven State Propagation**: State changes propagate through events

-   **Deterministic Automation Layer**: Rules execute predictably

-   **Smart Contract Orchestration Primitive**: Reusable automation building block

🏆 Why This Matters
-------------------

> "Somnia Data Streams introduces new RPCs built for high-performance reading and writing, allowing applications to subscribe to live blockchain data and receive automatic updates as state changes occur. This marks a shift from static, indexer-driven blockchain interaction to a dynamic, event-driven model."

Your orchestrator demonstrates:

-   **Real-time reactivity** without polling or off-chain infrastructure

-   **Trustless automation** guaranteed by the network

-   **Composable primitives** that any contract can use

-   **Deterministic execution** for reliable automation

🔮 Future Enhancements
----------------------

-   Percentage-based rules (e.g., price drops by 20%)

-   Time-based rules (e.g., execute every 24 hours)

-   Multi-condition rules (AND/OR logic)

-   Rule templates for common scenarios

-   Analytics dashboard with charts

-   Email/SMS notifications

-   Cross-chain automation (via Somnia's interoperability)

🤝 Contributing
---------------

Contributions are welcome! Please feel free to submit a Pull Request.

📄 License
----------

This project is licensed under the MIT License - see the LICENSE file for details.

🙏 Acknowledgments
------------------

-   [Somnia](https://somnia.network/) for their native reactivity technology

-   [Hardhat](https://hardhat.org/) for the development environment

-   [Next.js](https://nextjs.org/) for the frontend framework

-   [Wagmi](https://wagmi.sh/) for React hooks for Ethereum
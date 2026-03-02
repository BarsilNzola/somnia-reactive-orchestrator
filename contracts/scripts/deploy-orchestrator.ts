import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as fs from "fs";

dotenv.config();

async function main() {
  console.log("Starting Somnia Reactive Orchestrator deployment...");
  console.log("==================================================");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "SOM");

  // Deploy LiquidityPool (Source Contract)
  console.log("\nDeploying LiquidityPool...");
  const INITIAL_LIQUIDITY = ethers.parseEther("15000");
  const INITIAL_APY = 500;
  const INITIAL_PRICE = ethers.parseEther("100");

  const LiquidityPoolFactory = await ethers.getContractFactory("LiquidityPool");
  const liquidityPool = await LiquidityPoolFactory.deploy(
    INITIAL_LIQUIDITY,
    INITIAL_APY,
    INITIAL_PRICE
  );
  await liquidityPool.waitForDeployment();
  const liquidityPoolAddress = await liquidityPool.getAddress();
  console.log("LiquidityPool deployed to:", liquidityPoolAddress);

  // Deploy StakingManager (Target Contract)
  console.log("\nDeploying StakingManager...");
  const INITIAL_REWARD_RATE = 1000;
  const INITIAL_ALLOCATION = 50;

  const StakingManagerFactory = await ethers.getContractFactory("StakingManager");
  const stakingManager = await StakingManagerFactory.deploy(
    INITIAL_REWARD_RATE,
    INITIAL_ALLOCATION
  );
  await stakingManager.waitForDeployment();
  const stakingManagerAddress = await stakingManager.getAddress();
  console.log("StakingManager deployed to:", stakingManagerAddress);

  // Deploy ReactiveOrchestrator
  console.log("\nDeploying ReactiveOrchestrator...");
  const ReactiveOrchestratorFactory = await ethers.getContractFactory("ReactiveOrchestrator");
  const orchestrator = await ReactiveOrchestratorFactory.deploy();
  await orchestrator.waitForDeployment();
  const orchestratorAddress = await orchestrator.getAddress();
  console.log("ReactiveOrchestrator deployed to:", orchestratorAddress);

  // Transfer ownership of StakingManager to Orchestrator
  console.log("\nTransferring StakingManager ownership to Orchestrator...");
  const transferTx = await stakingManager.connect(deployer).transferOwnership(orchestratorAddress);
  await transferTx.wait();
  
  // Verify ownership transfer
  const newOwner = await stakingManager.owner();
  console.log("StakingManager owner is now:", newOwner);
  if (newOwner !== orchestratorAddress) {
    throw new Error("Ownership transfer failed!");
  }

  // Register initial rules
  console.log("\nRegistering initial rules...");

  // Rule 1: Pause staking when liquidity drops below 10,000 SOM
  const liquidityEventSig = ethers.id("LiquidityUpdated(uint256,uint256)").substring(0, 10);
  
  // Use interface directly to avoid TypeChain issues
  const stakingManagerInterface = new ethers.Interface([
    "function pauseStaking() external",
    "function rebalanceStrategy() external",
    "function updateRewardRate(uint256 newRate) external"
  ]);
  
  const pauseCallData = stakingManagerInterface.encodeFunctionData("pauseStaking", []);
  
  console.log("  - Registering liquidity guard rule...");
  const rule1Tx = await orchestrator.connect(deployer).registerRule(
    liquidityPoolAddress,
    liquidityEventSig,
    ethers.parseEther("10000"), // Threshold: 10,000 SOM
    stakingManagerAddress,
    pauseCallData
  );
  await rule1Tx.wait();
  console.log("  Liquidity guard rule registered (Rule ID: 0)");

  // Rule 2: Rebalance when price drops below 80 SOM
  const priceEventSig = ethers.id("OraclePriceUpdated(uint256,uint256)").substring(0, 10);
  const rebalanceData = stakingManagerInterface.encodeFunctionData("rebalanceStrategy", []);
  
  console.log("  - Registering price rebalance rule...");
  const rule2Tx = await orchestrator.connect(deployer).registerRule(
    liquidityPoolAddress,
    priceEventSig,
    ethers.parseEther("80"), // Threshold: 80 SOM (20% drop from 100)
    stakingManagerAddress,
    rebalanceData
  );
  await rule2Tx.wait();
  console.log("  Price rebalance rule registered (Rule ID: 1)");

  // Rule 3: Update reward rate when APY drops below 300
  const apyEventSig = ethers.id("APYUpdated(uint256,uint256)").substring(0, 10);
  const rateData = stakingManagerInterface.encodeFunctionData("updateRewardRate", [1500]);
  
  console.log("  - Registering APY reward rule...");
  const rule3Tx = await orchestrator.connect(deployer).registerRule(
    liquidityPoolAddress,
    apyEventSig,
    300, // Threshold: 300 APY
    stakingManagerAddress,
    rateData
  );
  await rule3Tx.wait();
  console.log("  APY reward rule registered (Rule ID: 2)");

  // Verify all rules
  console.log("\nVerifying registered rules...");
  for (let i = 0; i < 3; i++) {
    const rule = await orchestrator.getRule(i);
    console.log(`  Rule ${i}:`);
    console.log(`    - Source: ${rule.source}`);
    console.log(`    - EventSig: ${rule.eventSig}`);
    console.log(`    - Threshold: ${rule.threshold.toString()}`);
    console.log(`    - Target: ${rule.target}`);
    console.log(`    - Active: ${rule.active}`);
  }

  // Deployment summary
  console.log("\n==================================================");
  console.log("Deployment Complete!");
  console.log("==================================================");
  console.log("Contract Addresses:");
  console.log("  - LiquidityPool (Source):", liquidityPoolAddress);
  console.log("  - StakingManager (Target):", stakingManagerAddress);
  console.log("  - ReactiveOrchestrator:", orchestratorAddress);
  console.log("\nRegistered Rules:");
  console.log("  - Rule 0: Pause staking when liquidity < 10,000 SOM");
  console.log("  - Rule 1: Rebalance when price < 80 SOM");
  console.log("  - Rule 2: Update reward rate to 1500 when APY < 300");
  console.log("\nNext steps:");
  console.log("  1. Update your frontend with these contract addresses");
  console.log("  2. Create Somnia reactivity subscriptions for these events");
  console.log("  3. Test the system by emitting events from LiquidityPool");
  console.log("==================================================");

  // Save deployment info to file
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      liquidityPool: liquidityPoolAddress,
      stakingManager: stakingManagerAddress,
      orchestrator: orchestratorAddress
    },
    rules: [
      {
        id: 0,
        type: "Liquidity Guard",
        event: "LiquidityUpdated",
        threshold: "10000 SOM",
        action: "pauseStaking"
      },
      {
        id: 1,
        type: "Price Rebalance",
        event: "OraclePriceUpdated",
        threshold: "80 SOM",
        action: "rebalanceStrategy"
      },
      {
        id: 2,
        type: "APY Reward Update",
        event: "APYUpdated",
        threshold: "300",
        action: "updateRewardRate(1500)"
      }
    ]
  };

  fs.writeFileSync(
    "deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\nDeployment info saved to deployment.json");
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\nDeployment failed:", error);
    process.exit(1);
  });
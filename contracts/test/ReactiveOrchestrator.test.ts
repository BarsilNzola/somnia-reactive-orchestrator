import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
const { time } = require("@nomicfoundation/hardhat-network-helpers");

// Helper function to get provider
const getProvider = () => {
  return (ethers as any).provider;
};

describe("ReactiveOrchestrator", function () {
  let orchestrator: any;
  let liquidityPool: any;
  let stakingManager: any;
  let deployer: SignerWithAddress;
  let user: SignerWithAddress;
  let ruleManager: SignerWithAddress;

  const LIQUIDITY_THRESHOLD = ethers.parseEther("10000");
  const INITIAL_LIQUIDITY = ethers.parseEther("15000");
  const INITIAL_APY = 500;
  const INITIAL_PRICE = ethers.parseEther("100");
  const INITIAL_REWARD_RATE = 1000;
  const INITIAL_ALLOCATION = 50;

  beforeEach(async function () {
    const signers = await ethers.getSigners();
    deployer = signers[0] as SignerWithAddress;
    user = signers[1] as SignerWithAddress;
    ruleManager = signers[2] as SignerWithAddress;

    // Deploy LiquidityPool
    const LiquidityPoolFactory = await ethers.getContractFactory("LiquidityPool");
    liquidityPool = await LiquidityPoolFactory.deploy(
      INITIAL_LIQUIDITY,
      INITIAL_APY,
      INITIAL_PRICE
    );

    // Deploy StakingManager
    const StakingManagerFactory = await ethers.getContractFactory("StakingManager");
    stakingManager = await StakingManagerFactory.deploy(
      INITIAL_REWARD_RATE,
      INITIAL_ALLOCATION
    );

    // Deploy ReactiveOrchestrator
    const ReactiveOrchestratorFactory = await ethers.getContractFactory("ReactiveOrchestrator");
    orchestrator = await ReactiveOrchestratorFactory.deploy();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await orchestrator.owner()).to.equal(deployer.address);
    });

    it("Should initialize with zero rules", async function () {
      expect(await orchestrator.getNextRuleId()).to.equal(0);
    });
  });

  describe("Rule Management", function () {
    let eventSig: string;
    let pauseCallData: string;

    beforeEach(async function () {
      eventSig = ethers.id("LiquidityUpdated(uint256,uint256)").substring(0, 10);
      pauseCallData = stakingManager.interface.encodeFunctionData("pauseStaking", []);
    });

    it("Should register a new rule", async function () {
      const tx = await orchestrator.connect(deployer).registerRule(
        await liquidityPool.getAddress(),
        eventSig,
        LIQUIDITY_THRESHOLD,
        await stakingManager.getAddress(),
        pauseCallData
      );

      await expect(tx)
        .to.emit(orchestrator, "RuleRegistered")
        .withArgs(0, await liquidityPool.getAddress(), await stakingManager.getAddress());

      const rule = await orchestrator.getRule(0);
      expect(rule.source).to.equal(await liquidityPool.getAddress());
      expect(rule.eventSig).to.equal(eventSig);
      expect(rule.threshold).to.equal(LIQUIDITY_THRESHOLD);
      expect(rule.target).to.equal(await stakingManager.getAddress());
      expect(rule.callData).to.equal(pauseCallData);
      expect(rule.active).to.be.true;
      expect(rule.createdAt).to.be.gt(0);
    });

    it("Should not allow non-owner to register rule", async function () {
      await expect(
        orchestrator.connect(user).registerRule(
          await liquidityPool.getAddress(),
          eventSig,
          LIQUIDITY_THRESHOLD,
          await stakingManager.getAddress(),
          pauseCallData
        )
      ).to.be.revertedWith("Only owner");
    });

    it("Should deactivate a rule", async function () {
      // First register a rule
      await orchestrator.connect(deployer).registerRule(
        await liquidityPool.getAddress(),
        eventSig,
        LIQUIDITY_THRESHOLD,
        await stakingManager.getAddress(),
        pauseCallData
      );

      // Then deactivate it
      const tx = await orchestrator.connect(deployer).deactivateRule(0);

      await expect(tx)
        .to.emit(orchestrator, "RuleDeactivated")
        .withArgs(0);

      expect(await orchestrator.isRuleActive(0)).to.be.false;
      
      const rule = await orchestrator.getRule(0);
      expect(rule.active).to.be.false;
    });

    it("Should not deactivate already inactive rule", async function () {
      await expect(
        orchestrator.connect(deployer).deactivateRule(999)
      ).to.be.revertedWith("Rule not active");
    });
  });

  describe("Event Handling", function () {
    let eventSig: string;
    let pauseCallData: string;

    beforeEach(async function () {
      eventSig = ethers.id("LiquidityUpdated(uint256,uint256)").substring(0, 10);
      pauseCallData = stakingManager.interface.encodeFunctionData("pauseStaking", []);
      
      // Register rule
      await orchestrator.connect(deployer).registerRule(
        await liquidityPool.getAddress(),
        eventSig,
        LIQUIDITY_THRESHOLD,
        await stakingManager.getAddress(),
        pauseCallData
      );
    });

    it("Should execute rule when threshold is crossed", async function () {
      // Initially staking should be active
      expect(await stakingManager.getStakingStatus()).to.be.false;

      // Update liquidity below threshold (should trigger rule)
      const tx = await liquidityPool.connect(deployer).updateLiquidity(
        ethers.parseEther("5000")
      );

      await expect(tx)
        .to.emit(orchestrator, "RuleExecuted")
        .withArgs(0, true, await time.latest());

      // Check that staking was paused
      expect(await stakingManager.getStakingStatus()).to.be.true;

      // Check execution logs
      const logs = await orchestrator.getExecutionLogs(0);
      expect(logs.length).to.equal(1);
      expect(logs[0].ruleId).to.equal(0);
      expect(logs[0].success).to.be.true;
      expect(logs[0].gasUsed).to.be.gt(0);
    });

    it("Should not execute when above threshold", async function () {
      // Update liquidity above threshold (should not trigger rule)
      const tx = await liquidityPool.connect(deployer).updateLiquidity(
        ethers.parseEther("20000")
      );

      // Wait for any potential event
      await tx.wait();

      // Check execution logs - should be empty
      const logs = await orchestrator.getExecutionLogs(0);
      expect(logs.length).to.equal(0);
      
      // Staking should remain active
      expect(await stakingManager.getStakingStatus()).to.be.false;
    });

    it("Should not execute for inactive rule", async function () {
      // Deactivate the rule
      await orchestrator.connect(deployer).deactivateRule(0);

      // Update liquidity below threshold (should not trigger rule)
      const tx = await liquidityPool.connect(deployer).updateLiquidity(
        ethers.parseEther("5000")
      );
      
      await tx.wait();

      // Check execution logs - should be empty
      const logs = await orchestrator.getExecutionLogs(0);
      expect(logs.length).to.equal(0);
    });

    it("Should handle multiple executions", async function () {
      // First execution
      await liquidityPool.connect(deployer).updateLiquidity(ethers.parseEther("5000"));
      
      // Update back above threshold
      await liquidityPool.connect(deployer).updateLiquidity(ethers.parseEther("15000"));
      
      // Second execution
      await liquidityPool.connect(deployer).updateLiquidity(ethers.parseEther("3000"));

      // Check logs
      const logs = await orchestrator.getExecutionLogs(0);
      expect(logs.length).to.equal(2);
      
      for (const log of logs) {
        expect(log.success).to.be.true;
      }
    });
  });

  describe("Multiple Rules", function () {
    it("Should handle multiple rules with different targets", async function () {
      // Register first rule (pause staking)
      const pauseSig = ethers.id("LiquidityUpdated(uint256,uint256)").substring(0, 10);
      const pauseData = stakingManager.interface.encodeFunctionData("pauseStaking", []);
      
      await orchestrator.connect(deployer).registerRule(
        await liquidityPool.getAddress(),
        pauseSig,
        LIQUIDITY_THRESHOLD,
        await stakingManager.getAddress(),
        pauseData
      );

      // Register second rule (update reward rate)
      const rateSig = ethers.id("APYUpdated(uint256,uint256)").substring(0, 10);
      const rateData = stakingManager.interface.encodeFunctionData("updateRewardRate", [2000]);
      
      await orchestrator.connect(deployer).registerRule(
        await liquidityPool.getAddress(),
        rateSig,
        1000, // APY threshold
        await stakingManager.getAddress(),
        rateData
      );

      // Trigger first rule
      await liquidityPool.connect(deployer).updateLiquidity(ethers.parseEther("5000"));
      
      // Check first rule executed
      let logs1 = await orchestrator.getExecutionLogs(0);
      expect(logs1.length).to.equal(1);
      
      // Trigger second rule
      await liquidityPool.connect(deployer).updateAPY(500); // Below threshold
      
      // Check second rule executed
      let logs2 = await orchestrator.getExecutionLogs(1);
      expect(logs2.length).to.equal(1);
      
      // Verify staking was paused
      expect(await stakingManager.getStakingStatus()).to.be.true;
      
      // Verify reward rate was updated
      expect(await stakingManager.getRewardRate()).to.equal(2000);
    });
  });

  describe("Oracle Price Events", function () {
    it("Should trigger on price drop", async function () {
      // Register rule for price drops
      const priceSig = ethers.id("OraclePriceUpdated(uint256,uint256)").substring(0, 10);
      const rebalanceData = stakingManager.interface.encodeFunctionData("rebalanceStrategy", []);
      
      await orchestrator.connect(deployer).registerRule(
        await liquidityPool.getAddress(),
        priceSig,
        ethers.parseEther("80"), // Price threshold (20% drop from 100)
        await stakingManager.getAddress(),
        rebalanceData
      );

      // Get initial allocation
      const initialAllocation = await stakingManager.getStrategyAllocation();

      // Update price to trigger rule (drop below 80)
      const tx = await liquidityPool.connect(deployer).updatePrice(ethers.parseEther("75"));

      await expect(tx)
        .to.emit(orchestrator, "RuleExecuted")
        .withArgs(0, true, await time.latest());

      // Check that strategy was rebalanced
      const newAllocation = await stakingManager.getStrategyAllocation();
      expect(newAllocation).to.not.equal(initialAllocation);
    });

    it("Should not trigger on price increase", async function () {
      // Register rule for price drops
      const priceSig = ethers.id("OraclePriceUpdated(uint256,uint256)").substring(0, 10);
      const rebalanceData = stakingManager.interface.encodeFunctionData("rebalanceStrategy", []);
      
      await orchestrator.connect(deployer).registerRule(
        await liquidityPool.getAddress(),
        priceSig,
        ethers.parseEther("80"),
        await stakingManager.getAddress(),
        rebalanceData
      );

      // Update price above threshold (increase)
      const tx = await liquidityPool.connect(deployer).updatePrice(ethers.parseEther("120"));
      
      await tx.wait();

      // Check execution logs - should be empty
      const logs = await orchestrator.getExecutionLogs(0);
      expect(logs.length).to.equal(0);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle rule with exact threshold value", async function () {
      // Register rule with exact threshold
      const eventSig = ethers.id("LiquidityUpdated(uint256,uint256)").substring(0, 10);
      const pauseData = stakingManager.interface.encodeFunctionData("pauseStaking", []);
      
      await orchestrator.connect(deployer).registerRule(
        await liquidityPool.getAddress(),
        eventSig,
        ethers.parseEther("10000"),
        await stakingManager.getAddress(),
        pauseData
      );

      // Update liquidity exactly at threshold (should NOT trigger because condition is < threshold)
      await liquidityPool.connect(deployer).updateLiquidity(ethers.parseEther("10000"));

      // Check execution logs - should be empty
      const logs = await orchestrator.getExecutionLogs(0);
      expect(logs.length).to.equal(0);
      
      // Update liquidity just below threshold
      await liquidityPool.connect(deployer).updateLiquidity(ethers.parseEther("9999"));

      // Should trigger now
      const logsAfter = await orchestrator.getExecutionLogs(0);
      expect(logsAfter.length).to.equal(1);
    });

    it("Should handle failed target calls gracefully", async function () {
      // Register rule with invalid target call (calling non-existent function)
      const eventSig = ethers.id("LiquidityUpdated(uint256,uint256)").substring(0, 10);
      const invalidData = "0x12345678"; // Invalid function signature
      
      await orchestrator.connect(deployer).registerRule(
        await liquidityPool.getAddress(),
        eventSig,
        LIQUIDITY_THRESHOLD,
        await stakingManager.getAddress(),
        invalidData
      );

      // Trigger rule
      const tx = await liquidityPool.connect(deployer).updateLiquidity(ethers.parseEther("5000"));

      await expect(tx)
        .to.emit(orchestrator, "RuleFailed")
        .withArgs(0, await getProvider()?.then((p: any) => p.getTransactionReceipt(tx.hash))?.then((r: any) => r.logs[0]?.data));
    });
  });
});
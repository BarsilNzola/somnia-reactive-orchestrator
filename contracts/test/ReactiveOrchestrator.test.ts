import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("ReactiveOrchestrator", function () {
  let orchestrator: any;
  let liquidityPool: any;
  let stakingManager: any;
  let deployer: SignerWithAddress;
  let user: SignerWithAddress;

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

    // Transfer ownership of StakingManager to the orchestrator
    const orchestratorAddress = await orchestrator.getAddress();
    await stakingManager.connect(deployer).transferOwnership(orchestratorAddress);
    
    // Verify ownership transfer
    const newOwner = await stakingManager.owner();
    expect(newOwner).to.equal(orchestratorAddress);
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
      await orchestrator.connect(deployer).registerRule(
        await liquidityPool.getAddress(),
        eventSig,
        LIQUIDITY_THRESHOLD,
        await stakingManager.getAddress(),
        pauseCallData
      );

      const tx = await orchestrator.connect(deployer).deactivateRule(0);
      await expect(tx).to.emit(orchestrator, "RuleDeactivated").withArgs(0);

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
    let eventTopic: string;
    let pauseCallData: string;

    beforeEach(async function () {
      eventSig = ethers.id("LiquidityUpdated(uint256,uint256)").substring(0, 10);
      eventTopic = liquidityPool.interface.getEvent("LiquidityUpdated").topicHash;
      pauseCallData = stakingManager.interface.encodeFunctionData("pauseStaking", []);
      
      await orchestrator.connect(deployer).registerRule(
        await liquidityPool.getAddress(),
        eventSig,
        LIQUIDITY_THRESHOLD,
        await stakingManager.getAddress(),
        pauseCallData
      );
    });

    it("Should execute rule when threshold is crossed", async function () {
      // Verify initial state
      expect(await stakingManager.getStakingStatus()).to.be.false;

      const timestamp = await time.latest();
      const liquidityValue = ethers.parseEther("5000");
      
      const eventTopics = [eventTopic];
      const eventData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256"], 
        [liquidityValue, timestamp]
      );
      
      // Trigger the event
      await orchestrator.connect(deployer).testTriggerEvent(
        await liquidityPool.getAddress(),
        eventTopics,
        eventData
      );

      // Check execution logs
      const logs = await orchestrator.getExecutionLogs(0);
      expect(logs.length).to.equal(1);
      expect(logs[0].success).to.be.true;
      
      // Verify staking was paused
      const stakingStatus = await stakingManager.getStakingStatus();
      expect(stakingStatus).to.be.true;
    });

    it("Should not execute when above threshold", async function () {
      const timestamp = await time.latest();
      const eventTopics = [eventTopic];
      const eventData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256"], 
        [ethers.parseEther("20000"), timestamp]
      );
      
      await orchestrator.connect(deployer).testTriggerEvent(
        await liquidityPool.getAddress(),
        eventTopics,
        eventData
      );

      const logs = await orchestrator.getExecutionLogs(0);
      expect(logs.length).to.equal(0);
      expect(await stakingManager.getStakingStatus()).to.be.false;
    });

    it("Should not execute for inactive rule", async function () {
      await orchestrator.connect(deployer).deactivateRule(0);

      const timestamp = await time.latest();
      const eventTopics = [eventTopic];
      const eventData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256"], 
        [ethers.parseEther("5000"), timestamp]
      );
      
      await orchestrator.connect(deployer).testTriggerEvent(
        await liquidityPool.getAddress(),
        eventTopics,
        eventData
      );

      const logs = await orchestrator.getExecutionLogs(0);
      expect(logs.length).to.equal(0);
    });

    it("Should handle multiple executions", async function () {
      const eventTopics = [eventTopic];
      
      // First execution
      let timestamp = await time.latest();
      let eventData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256"], 
        [ethers.parseEther("5000"), timestamp]
      );
      
      await orchestrator.connect(deployer).testTriggerEvent(
        await liquidityPool.getAddress(),
        eventTopics,
        eventData
      );
      
      // Verify first execution
      let logs = await orchestrator.getExecutionLogs(0);
      expect(logs.length).to.equal(1);
      expect(logs[0].success).to.be.true;
      expect(await stakingManager.getStakingStatus()).to.be.true;
      
      // Resume staking through the orchestrator's executeTargetCall function
      const resumeData = stakingManager.interface.encodeFunctionData("resumeStaking", []);
      await orchestrator.connect(deployer).executeTargetCall(
        await stakingManager.getAddress(),
        resumeData
      );
      
      // Verify staking is resumed
      expect(await stakingManager.getStakingStatus()).to.be.false;
      
      // Second execution
      timestamp = await time.latest();
      eventData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256"], 
        [ethers.parseEther("3000"), timestamp]
      );
      
      await orchestrator.connect(deployer).testTriggerEvent(
        await liquidityPool.getAddress(),
        eventTopics,
        eventData
      );

      logs = await orchestrator.getExecutionLogs(0);
      expect(logs.length).to.equal(2);
      
      for (const log of logs) {
        expect(log.success).to.be.true;
      }
      
      expect(await stakingManager.getStakingStatus()).to.be.true;
    });
  });

  describe("Multiple Rules", function () {
    it("Should handle multiple rules with different targets", async function () {
      const pauseSig = ethers.id("LiquidityUpdated(uint256,uint256)").substring(0, 10);
      const pauseTopic = liquidityPool.interface.getEvent("LiquidityUpdated").topicHash;
      const pauseData = stakingManager.interface.encodeFunctionData("pauseStaking", []);
      
      await orchestrator.connect(deployer).registerRule(
        await liquidityPool.getAddress(),
        pauseSig,
        LIQUIDITY_THRESHOLD,
        await stakingManager.getAddress(),
        pauseData
      );

      const rateSig = ethers.id("APYUpdated(uint256,uint256)").substring(0, 10);
      const rateTopic = liquidityPool.interface.getEvent("APYUpdated").topicHash;
      const rateData = stakingManager.interface.encodeFunctionData("updateRewardRate", [2000]);
      
      await orchestrator.connect(deployer).registerRule(
        await liquidityPool.getAddress(),
        rateSig,
        1000,
        await stakingManager.getAddress(),
        rateData
      );

      // Verify initial state
      expect(await stakingManager.getStakingStatus()).to.be.false;
      expect(await stakingManager.getRewardRate()).to.equal(1000);

      // Trigger first rule (liquidity update)
      let timestamp = await time.latest();
      let eventData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256"], 
        [ethers.parseEther("5000"), timestamp]
      );
      let eventTopics = [pauseTopic];
      
      await orchestrator.connect(deployer).testTriggerEvent(
        await liquidityPool.getAddress(),
        eventTopics,
        eventData
      );
      
      // Verify first rule executed
      const logs1 = await orchestrator.getExecutionLogs(0);
      expect(logs1.length).to.equal(1);
      expect(logs1[0].success).to.be.true;
      expect(await stakingManager.getStakingStatus()).to.be.true;
      
      // Trigger second rule (APY update)
      timestamp = await time.latest();
      eventData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256"], 
        [500, timestamp]
      );
      eventTopics = [rateTopic];
      
      await orchestrator.connect(deployer).testTriggerEvent(
        await liquidityPool.getAddress(),
        eventTopics,
        eventData
      );

      // Verify second rule executed
      const logs2 = await orchestrator.getExecutionLogs(1);
      expect(logs2.length).to.equal(1);
      expect(logs2[0].success).to.be.true;
      
      expect(await stakingManager.getRewardRate()).to.equal(2000);
    });
  });

  describe("Oracle Price Events", function () {
    it("Should trigger on price drop", async function () {
      const priceSig = ethers.id("OraclePriceUpdated(uint256,uint256)").substring(0, 10);
      const priceTopic = liquidityPool.interface.getEvent("OraclePriceUpdated").topicHash;
      const rebalanceData = stakingManager.interface.encodeFunctionData("rebalanceStrategy", []);
      
      await orchestrator.connect(deployer).registerRule(
        await liquidityPool.getAddress(),
        priceSig,
        ethers.parseEther("80"),
        await stakingManager.getAddress(),
        rebalanceData
      );

      const initialAllocation = await stakingManager.getStrategyAllocation();

      const timestamp = await time.latest();
      const eventData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256"], 
        [ethers.parseEther("75"), timestamp]
      );
      const eventTopics = [priceTopic];
      
      await orchestrator.connect(deployer).testTriggerEvent(
        await liquidityPool.getAddress(),
        eventTopics,
        eventData
      );

      const logs = await orchestrator.getExecutionLogs(0);
      expect(logs.length).to.equal(1);
      expect(logs[0].success).to.be.true;
      
      const newAllocation = await stakingManager.getStrategyAllocation();
      expect(newAllocation).to.not.equal(initialAllocation);
    });

    it("Should not trigger on price increase", async function () {
      const priceSig = ethers.id("OraclePriceUpdated(uint256,uint256)").substring(0, 10);
      const priceTopic = liquidityPool.interface.getEvent("OraclePriceUpdated").topicHash;
      const rebalanceData = stakingManager.interface.encodeFunctionData("rebalanceStrategy", []);
      
      await orchestrator.connect(deployer).registerRule(
        await liquidityPool.getAddress(),
        priceSig,
        ethers.parseEther("80"),
        await stakingManager.getAddress(),
        rebalanceData
      );

      const timestamp = await time.latest();
      const eventData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256"], 
        [ethers.parseEther("120"), timestamp]
      );
      const eventTopics = [priceTopic];
      
      await orchestrator.connect(deployer).testTriggerEvent(
        await liquidityPool.getAddress(),
        eventTopics,
        eventData
      );

      const logs = await orchestrator.getExecutionLogs(0);
      expect(logs.length).to.equal(0);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle rule with exact threshold value", async function () {
      const eventSig = ethers.id("LiquidityUpdated(uint256,uint256)").substring(0, 10);
      const eventTopic = liquidityPool.interface.getEvent("LiquidityUpdated").topicHash;
      const pauseData = stakingManager.interface.encodeFunctionData("pauseStaking", []);
      
      await orchestrator.connect(deployer).registerRule(
        await liquidityPool.getAddress(),
        eventSig,
        ethers.parseEther("10000"),
        await stakingManager.getAddress(),
        pauseData
      );

      // Update exactly at threshold
      let timestamp = await time.latest();
      let eventData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256"], 
        [ethers.parseEther("10000"), timestamp]
      );
      let eventTopics = [eventTopic];
      
      await orchestrator.connect(deployer).testTriggerEvent(
        await liquidityPool.getAddress(),
        eventTopics,
        eventData
      );

      // Should not execute
      let logs = await orchestrator.getExecutionLogs(0);
      expect(logs.length).to.equal(0);
      expect(await stakingManager.getStakingStatus()).to.be.false;
      
      // Update below threshold
      timestamp = await time.latest();
      eventData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256"], 
        [ethers.parseEther("9999"), timestamp]
      );
      
      await orchestrator.connect(deployer).testTriggerEvent(
        await liquidityPool.getAddress(),
        eventTopics,
        eventData
      );

      // Should execute now
      logs = await orchestrator.getExecutionLogs(0);
      expect(logs.length).to.equal(1);
      expect(logs[0].success).to.be.true;
      expect(await stakingManager.getStakingStatus()).to.be.true;
    });

    it("Should handle failed target calls gracefully", async function () {
      const eventSig = ethers.id("LiquidityUpdated(uint256,uint256)").substring(0, 10);
      const eventTopic = liquidityPool.interface.getEvent("LiquidityUpdated").topicHash;
      const invalidData = "0x12345678"; // Invalid function signature
      
      await orchestrator.connect(deployer).registerRule(
        await liquidityPool.getAddress(),
        eventSig,
        LIQUIDITY_THRESHOLD,
        await stakingManager.getAddress(),
        invalidData
      );

      const timestamp = await time.latest();
      const eventData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256"], 
        [ethers.parseEther("5000"), timestamp]
      );
      const eventTopics = [eventTopic];
      
      await orchestrator.connect(deployer).testTriggerEvent(
        await liquidityPool.getAddress(),
        eventTopics,
        eventData
      );

      const logs = await orchestrator.getExecutionLogs(0);
      expect(logs.length).to.equal(1);
      expect(logs[0].success).to.be.false;
      expect(await stakingManager.getStakingStatus()).to.be.false;
    });
  });
});
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interfaces/ITarget.sol";

contract StakingManager is ITarget {
    bool private stakingPaused;
    uint256 private rewardRate;
    uint256 private strategyAllocation;
    
    address public owner;
    
    event StakingPaused(uint256 timestamp);
    event StakingResumed(uint256 timestamp);
    event RewardRateUpdated(uint256 indexed newRate, uint256 timestamp);
    event StrategyRebalanced(uint256 indexed newAllocation, uint256 timestamp);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    constructor(uint256 initialRewardRate, uint256 initialAllocation) {
        owner = msg.sender;
        rewardRate = initialRewardRate;
        strategyAllocation = initialAllocation;
        stakingPaused = false;
    }
    
    function pauseStaking() external onlyOwner {
        require(!stakingPaused, "Already paused");
        stakingPaused = true;
        emit StakingPaused(block.timestamp);
    }
    
    function resumeStaking() external onlyOwner {
        require(stakingPaused, "Not paused");
        stakingPaused = false;
        emit StakingResumed(block.timestamp);
    }
    
    function updateRewardRate(uint256 newRate) external onlyOwner {
        rewardRate = newRate;
        emit RewardRateUpdated(newRate, block.timestamp);
    }
    
    function rebalanceStrategy() external onlyOwner {
        strategyAllocation = block.timestamp % 100;
        emit StrategyRebalanced(strategyAllocation, block.timestamp);
    }
    
    function getStakingStatus() external view returns (bool) {
        return stakingPaused;
    }
    
    function getRewardRate() external view returns (uint256) {
        return rewardRate;
    }
    
    function getStrategyAllocation() external view returns (uint256) {
        return strategyAllocation;
    }
}
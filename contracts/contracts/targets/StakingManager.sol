// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import "../interfaces/ITarget.sol";

/**
 * @title StakingManager
 * @notice Target contract for the Reactive Orchestrator.
 * 
 */
contract StakingManager is ITarget {
    bool private stakingPaused;
    uint256 private rewardRate;
    uint256 private strategyAllocation;

    address public owner;
    mapping(address => bool) public allowedCallers;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event CallerAdded(address indexed caller);
    event CallerRemoved(address indexed caller);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyAuthorized() {
        require(msg.sender == owner || allowedCallers[msg.sender], "Not authorized");
        _;
    }

    constructor(uint256 initialRewardRate, uint256 initialAllocation) {
        owner = msg.sender;
        rewardRate = initialRewardRate;
        strategyAllocation = initialAllocation;
        stakingPaused = false;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function addAllowedCaller(address caller) external onlyOwner {
        allowedCallers[caller] = true;
        emit CallerAdded(caller);
    }

    function removeAllowedCaller(address caller) external onlyOwner {
        allowedCallers[caller] = false;
        emit CallerRemoved(caller);
    }

    // ✅ Changed from onlyOwner → onlyAuthorized so orchestrator can call these
    function pauseStaking() external onlyAuthorized {
        require(!stakingPaused, "Already paused");
        stakingPaused = true;
        emit StakingPaused(block.timestamp);
    }

    function resumeStaking() external onlyAuthorized {
        require(stakingPaused, "Not paused");
        stakingPaused = false;
        emit StakingResumed(block.timestamp);
    }

    function updateRewardRate(uint256 newRate) external onlyAuthorized {
        rewardRate = newRate;
        emit RewardRateUpdated(newRate, block.timestamp);
    }

    function rebalanceStrategy() external onlyAuthorized {
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
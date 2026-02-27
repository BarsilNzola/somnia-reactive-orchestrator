// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface ITarget {
    event StakingPaused(uint256 timestamp);
    event StakingResumed(uint256 timestamp);
    event RewardRateUpdated(uint256 indexed newRate, uint256 timestamp);
    event StrategyRebalanced(uint256 indexed newAllocation, uint256 timestamp);
    
    function pauseStaking() external;
    function resumeStaking() external;
    function updateRewardRate(uint256 newRate) external;
    function rebalanceStrategy() external;
    function getStakingStatus() external view returns (bool);
    function getRewardRate() external view returns (uint256);
}
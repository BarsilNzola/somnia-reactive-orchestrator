// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ISource {
    event LiquidityUpdated(uint256 indexed newLiquidity, uint256 timestamp);
    event APYUpdated(uint256 indexed newAPY, uint256 timestamp);
    event OraclePriceUpdated(uint256 indexed newPrice, uint256 timestamp);
    event ThresholdCrossed(string indexed metric, uint256 value, uint256 threshold);
    
    function getLiquidity() external view returns (uint256);
    function getAPY() external view returns (uint256);
    function getPrice() external view returns (uint256);
}
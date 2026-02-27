// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interfaces/ISource.sol";

contract LiquidityPool is ISource {
    uint256 private liquidity;
    uint256 private apy;
    uint256 private price;
    
    address public owner;
    
    event LiquidityUpdated(uint256 indexed newLiquidity, uint256 timestamp);
    event APYUpdated(uint256 indexed newAPY, uint256 timestamp);
    event OraclePriceUpdated(uint256 indexed newPrice, uint256 timestamp);
    event ThresholdCrossed(string indexed metric, uint256 value, uint256 threshold);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    constructor(uint256 initialLiquidity, uint256 initialAPY, uint256 initialPrice) {
        owner = msg.sender;
        liquidity = initialLiquidity;
        apy = initialAPY;
        price = initialPrice;
    }
    
    function updateLiquidity(uint256 newLiquidity) external onlyOwner {
        liquidity = newLiquidity;
        emit LiquidityUpdated(newLiquidity, block.timestamp);
        
        if (newLiquidity < 10000 ether) {
            emit ThresholdCrossed("liquidity", newLiquidity, 10000 ether);
        }
    }
    
    function updateAPY(uint256 newAPY) external onlyOwner {
        apy = newAPY;
        emit APYUpdated(newAPY, block.timestamp);
    }
    
    function updatePrice(uint256 newPrice) external onlyOwner {
        uint256 oldPrice = price;
        price = newPrice;
        emit OraclePriceUpdated(newPrice, block.timestamp);
        
        if (newPrice < (oldPrice * 80) / 100) {
            emit ThresholdCrossed("price_drop", newPrice, (oldPrice * 80) / 100);
        }
    }
    
    function getLiquidity() external view returns (uint256) {
        return liquidity;
    }
    
    function getAPY() external view returns (uint256) {
        return apy;
    }
    
    function getPrice() external view returns (uint256) {
        return price;
    }
}
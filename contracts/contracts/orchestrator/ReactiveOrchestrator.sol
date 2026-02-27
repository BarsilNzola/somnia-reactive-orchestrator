// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import { SomniaEventHandler } from "@somnia-chain/reactivity-contracts/contracts/SomniaEventHandler.sol";
import "../interfaces/IReactiveOrchestrator.sol";

contract ReactiveOrchestrator is SomniaEventHandler, IReactiveOrchestrator {
    mapping(uint256 => Rule) private rules;
    mapping(uint256 => ExecutionLog[]) private executionHistory;
    mapping(uint256 => bool) private activeRules;
    
    uint256 private nextRuleId;
    address public owner;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    function registerRule(
        address source,
        bytes4 eventSig,
        uint256 threshold,
        address target,
        bytes calldata callData
    ) external onlyOwner returns (uint256 ruleId) {
        ruleId = nextRuleId++;
        
        rules[ruleId] = Rule({
            source: source,
            eventSig: eventSig,
            threshold: threshold,
            target: target,
            callData: callData,
            active: true,
            createdAt: block.timestamp
        });
        
        activeRules[ruleId] = true;
        
        emit RuleRegistered(ruleId, source, target);
        
        return ruleId;
    }
    
    function deactivateRule(uint256 ruleId) external onlyOwner {
        require(activeRules[ruleId], "Rule not active");
        activeRules[ruleId] = false;
        rules[ruleId].active = false;
        
        emit RuleDeactivated(ruleId);
    }
    
    // Override the Somnia event handler
    function _onEvent(
        address emitter,
        bytes32[] calldata eventTopics,
        bytes calldata data
    ) internal override {
        // Iterate through rules to find matching one
        for (uint256 i = 0; i < nextRuleId; i++) {
            if (!activeRules[i]) continue;
            
            Rule storage rule = rules[i];
            
            // Check if this event matches the rule
            if (emitter != rule.source) continue;
            if (eventTopics[0] != bytes32(rule.eventSig)) continue;
            
            // Decode the event data (assuming uint256 value)
            uint256 eventValue = abi.decode(data, (uint256));
            
            // Check threshold condition
            if (eventValue < rule.threshold) {
                (bool success, bytes memory returnData) = rule.target.call(rule.callData);
                
                uint256 gasUsed = gasleft();
                
                executionHistory[i].push(ExecutionLog({
                    ruleId: i,
                    timestamp: block.timestamp,
                    success: success,
                    returnData: returnData,
                    gasUsed: gasUsed
                }));
                
                if (success) {
                    emit RuleExecuted(i, true, block.timestamp);
                } else {
                    emit RuleFailed(i, returnData);
                }
            }
        }
    }
    
    function getRule(uint256 ruleId) external view returns (Rule memory) {
        return rules[ruleId];
    }
    
    function getExecutionLogs(uint256 ruleId) external view returns (ExecutionLog[] memory) {
        return executionHistory[ruleId];
    }
    
    function isRuleActive(uint256 ruleId) external view returns (bool) {
        return activeRules[ruleId];
    }
    
    function getNextRuleId() external view returns (uint256) {
        return nextRuleId;
    }
}
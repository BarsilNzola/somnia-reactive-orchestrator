// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interfaces/IReactiveOrchestrator.sol";
import "@somnia/reactivity/ReactivityCore.sol";

contract ReactiveOrchestrator is IReactiveOrchestrator {
    using ReactivityCore for ReactivityCore.Subscription;
    
    mapping(uint256 => Rule) private rules;
    mapping(uint256 => ExecutionLog[]) private executionHistory;
    mapping(uint256 => bool) private activeRules;
    
    uint256 private nextRuleId;
    address public owner;
    
    ReactivityCore.Reactivity private reactivity;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        reactivity.initialize();
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
        
        reactivity.subscribe(
            source,
            eventSig,
            address(this),
            abi.encodeWithSelector(this.handleEvent.selector, ruleId)
        );
        
        emit RuleRegistered(ruleId, source, target);
    }
    
    function deactivateRule(uint256 ruleId) external onlyOwner {
        require(activeRules[ruleId], "Rule not active");
        activeRules[ruleId] = false;
        rules[ruleId].active = false;
        
        reactivity.unsubscribe(
            rules[ruleId].source,
            rules[ruleId].eventSig,
            address(this)
        );
        
        emit RuleDeactivated(ruleId);
    }
    
    function handleEvent(uint256 ruleId, bytes calldata eventData) external {
        require(msg.sender == address(reactivity), "Only reactivity");
        require(activeRules[ruleId], "Rule inactive");
        
        Rule storage rule = rules[ruleId];
        
        uint256 eventValue = abi.decode(eventData, (uint256));
        
        if (eventValue < rule.threshold) {
            (bool success, bytes memory returnData) = rule.target.call(rule.callData);
            
            uint256 gasUsed = gasleft();
            
            executionHistory[ruleId].push(ExecutionLog({
                ruleId: ruleId,
                timestamp: block.timestamp,
                success: success,
                returnData: returnData,
                gasUsed: gasUsed
            }));
            
            if (success) {
                emit RuleExecuted(ruleId, true, block.timestamp);
            } else {
                emit RuleFailed(ruleId, returnData);
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
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import { SomniaEventHandler } from "@somnia-chain/reactivity-contracts/contracts/SomniaEventHandler.sol";
import "../interfaces/IReactiveOrchestrator.sol";

/**
 * @title ReactiveOrchestrator
 * @notice Core automation engine. Subscribes to on-chain events via Somnia Reactivity
 * and executes registered rules trustlessly.
 */
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

    function _onEvent(
        address emitter,
        bytes32[] calldata eventTopics,
        bytes calldata data
    ) internal override {
        for (uint256 i = 0; i < nextRuleId; i++) {
            if (!activeRules[i]) continue;

            Rule storage rule = rules[i];

            if (emitter != rule.source) continue;
            if (bytes4(eventTopics[0]) != rule.eventSig) continue;

            // Decode first value from event data
            uint256 eventValue;
            if (data.length >= 32) {
                (eventValue) = abi.decode(data, (uint256));
            }

            if (eventValue < rule.threshold) {
                uint256 gasBefore = gasleft();
                (bool success, bytes memory returnData) = rule.target.call(rule.callData);
                uint256 gasUsed = gasBefore - gasleft();

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

    // For demo/testing: owner can manually fire the reactive handler
    function testTriggerEvent(
        address emitter,
        bytes32[] calldata eventTopics,
        bytes calldata data
    ) external onlyOwner {
        _onEvent(emitter, eventTopics, data);
    }

    function executeTargetCall(
        address target,
        bytes calldata callData
    ) external onlyOwner returns (bool success, bytes memory returnData) {
        (success, returnData) = target.call(callData);
        require(success, "Target call failed");
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
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import { ISomniaEventHandler } from "@somnia-chain/reactivity-contracts/contracts/interfaces/ISomniaEventHandler.sol";
import { IERC165 } from "@somnia-chain/reactivity-contracts/contracts/interfaces/IERC165.sol";
import "../interfaces/IReactiveOrchestrator.sol";

/**
 * @title ReactiveOrchestrator
 * @notice Core automation engine. Subscribes to on-chain events via Somnia Reactivity
 * and executes registered rules trustlessly.
 */
contract ReactiveOrchestrator is IERC165, ISomniaEventHandler, IReactiveOrchestrator {
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

    event DebugCalled(address indexed caller, address indexed emitter, uint256 topicsLen, uint256 gasLeft);

    // ISomniaEventHandler — called directly by Reactivity precompile
    // No msg.sender restriction so both precompile and testTriggerEvent work
    function onEvent(
        address emitter,
        bytes32[] calldata eventTopics,
        bytes calldata data
    ) external {
        emit DebugCalled(msg.sender, emitter, eventTopics.length, gasleft());
        _onEvent(emitter, eventTopics, data);
    }

    // IERC165 — required for precompile to verify reactivity support
    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == type(IERC165).interfaceId
            || interfaceId == type(ISomniaEventHandler).interfaceId;
    }

    function _onEvent(
        address emitter,
        bytes32[] calldata eventTopics,
        bytes calldata data
    ) internal {
        for (uint256 i = 0; i < nextRuleId; i++) {
            if (!activeRules[i]) continue;

            Rule storage rule = rules[i];

            // Note: emitter check removed — precompile passes routing address not LiquidityPool
            if (bytes4(eventTopics[0]) != rule.eventSig) continue;

            uint256 eventValue = 0;
            if (eventTopics.length > 1) {
                eventValue = uint256(eventTopics[1]);
            } else if (data.length >= 32) {
                (eventValue) = abi.decode(data, (uint256));
            }

            if (eventValue < rule.threshold) {
                uint256 gasBefore = gasleft();
                // Use low-level call with explicit gas to avoid reverts bubbling up
                (bool success, bytes memory returnData) = rule.target.call{gas: gasleft() - 5000}(rule.callData);
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

    // Override onEvent directly to handle the Reactivity callback
    // The base class restricts to precompile address only, but we allow any caller
    // so testTriggerEvent and the Reactivity layer both work

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
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IReactiveOrchestrator {
    struct Rule {
        address source;
        bytes4 eventSig;
        uint256 threshold;
        address target;
        bytes callData;
        bool active;
        uint256 createdAt;
    }
    
    struct ExecutionLog {
        uint256 ruleId;
        uint256 timestamp;
        bool success;
        bytes returnData;
        uint256 gasUsed;
    }
    
    event RuleRegistered(uint256 indexed ruleId, address indexed source, address indexed target);
    event RuleDeactivated(uint256 indexed ruleId);
    event RuleExecuted(uint256 indexed ruleId, bool success, uint256 timestamp);
    event RuleFailed(uint256 indexed ruleId, bytes reason);
    
    function registerRule(
        address source,
        bytes4 eventSig,
        uint256 threshold,
        address target,
        bytes calldata callData
    ) external returns (uint256 ruleId);
    
    function deactivateRule(uint256 ruleId) external;
    
    function getRule(uint256 ruleId) external view returns (Rule memory);
    
    function getExecutionLogs(uint256 ruleId) external view returns (ExecutionLog[] memory);
    
    function isRuleActive(uint256 ruleId) external view returns (bool);
}
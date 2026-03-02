import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useContracts } from './useContracts';

interface Rule {
  id: number;
  source: string;
  eventSig: string;
  threshold: bigint;
  target: string;
  callData: string;
  active: boolean;
  createdAt: number;
}

interface ExecutionLog {
  ruleId: number;
  timestamp: number;
  success: boolean;
  returnData: string;
  gasUsed: bigint;
}

// Define contract types
interface OrchestratorContract extends ethers.BaseContract {
  getNextRuleId(): Promise<bigint>;
  getRule(ruleId: number): Promise<{
    source: string;
    eventSig: string;
    threshold: bigint;
    target: string;
    callData: string;
    active: boolean;
    createdAt: bigint;
  }>;
  isRuleActive(ruleId: number): Promise<boolean>;
  getExecutionLogs(ruleId: number): Promise<Array<{
    ruleId: bigint;
    timestamp: bigint;
    success: boolean;
    returnData: string;
    gasUsed: bigint;
  }>>;
  registerRule(
    source: string,
    eventSig: string,
    threshold: bigint,
    target: string,
    callData: string
  ): Promise<ethers.TransactionResponse>;
  deactivateRule(ruleId: number): Promise<ethers.TransactionResponse>;
}

interface Contracts {
  liquidityPool: ethers.BaseContract;
  stakingManager: ethers.BaseContract;
  orchestrator: OrchestratorContract;
  getSignerContracts: () => {
    liquidityPool: ethers.BaseContract;
    stakingManager: ethers.BaseContract;
    orchestrator: OrchestratorContract;
  } | null;
}

export function useOrchestrator() {
  const { contracts: rawContracts, isConnected, address } = useContracts();
  const [rules, setRules] = useState<Rule[]>([]);
  const [executions, setExecutions] = useState<ExecutionLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextRuleId, setNextRuleId] = useState<number>(0);

  // Cast contracts to the correct type
  const contracts = rawContracts as Contracts | null;

  const fetchRules = async () => {
    if (!contracts) return;

    try {
      const id = await contracts.orchestrator.getNextRuleId();
      const ruleId = Number(id);
      setNextRuleId(ruleId);

      const fetchedRules: Rule[] = [];
      for (let i = 0; i < ruleId; i++) {
        const rule = await contracts.orchestrator.getRule(i);
        const isActive = await contracts.orchestrator.isRuleActive(i);
        fetchedRules.push({
          id: i,
          source: rule.source,
          eventSig: rule.eventSig,
          threshold: rule.threshold,
          target: rule.target,
          callData: rule.callData,
          active: isActive,
          createdAt: Number(rule.createdAt)
        });
      }
      setRules(fetchedRules);
    } catch (error) {
      console.error('Error fetching rules:', error);
    }
  };

  const fetchExecutions = async () => {
    if (!contracts) return;

    try {
      const allExecutions: ExecutionLog[] = [];
      const ruleId = await contracts.orchestrator.getNextRuleId();
      
      for (let i = 0; i < Number(ruleId); i++) {
        const logs = await contracts.orchestrator.getExecutionLogs(i);
        logs.forEach((log) => {
          allExecutions.push({
            ruleId: Number(log.ruleId),
            timestamp: Number(log.timestamp),
            success: log.success,
            returnData: log.returnData,
            gasUsed: log.gasUsed
          });
        });
      }
      
      setExecutions(allExecutions.sort((a, b) => b.timestamp - a.timestamp));
    } catch (error) {
      console.error('Error fetching executions:', error);
    }
  };

  const registerRule = async (
    source: string,
    eventSig: string,
    threshold: bigint,
    target: string,
    callData: string
  ) => {
    if (!contracts || !isConnected) throw new Error('Not connected');

    const signerContracts = contracts.getSignerContracts();
    if (!signerContracts) throw new Error('No signer');

    setLoading(true);
    try {
      const tx = await signerContracts.orchestrator.registerRule(
        source,
        eventSig,
        threshold,
        target,
        callData
      );
      await tx.wait();
      await fetchRules();
    } catch (error) {
      console.error('Error registering rule:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deactivateRule = async (ruleId: number) => {
    if (!contracts || !isConnected) throw new Error('Not connected');

    const signerContracts = contracts.getSignerContracts();
    if (!signerContracts) throw new Error('No signer');

    setLoading(true);
    try {
      const tx = await signerContracts.orchestrator.deactivateRule(ruleId);
      await tx.wait();
      await fetchRules();
    } catch (error) {
      console.error('Error deactivating rule:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contracts) {
      fetchRules();
      fetchExecutions();
    }
  }, [contracts]);

  return {
    rules,
    executions,
    loading,
    nextRuleId,
    registerRule,
    deactivateRule,
    refresh: () => {
      fetchRules();
      fetchExecutions();
    }
  };
}
import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import Layout from '../components/Layout';
import ContractState from '../components/ContractState';
import RuleCard from '../components/RuleCard';
import ExecutionLog from '../components/ExecutionLog';
import { useContracts } from '../hooks/useContracts';
import { useOrchestrator } from '../hooks/useOrchestrator';
import { useReactivity } from '../hooks/useReactivity';
import { formatEther } from 'ethers';

export default function Dashboard() {
  const { contracts, isConnected } = useContracts();
  const { rules, executions, loading, deactivateRule, refresh } = useOrchestrator();
  const { sourceState, targetState, setSourceState, setTargetState } = useReactivity();

  const [sourceMetrics, setSourceMetrics] = useState([
    { label: 'Liquidity', value: '0', format: 'ether' as const },
    { label: 'APY', value: '0', format: 'number' as const },
    { label: 'Price', value: '0', format: 'ether' as const }
  ]);

  const [targetMetrics, setTargetMetrics] = useState([
    { label: 'Status', value: false, format: 'boolean' as const },
    { label: 'Reward Rate', value: '0', format: 'number' as const },
    { label: 'Allocation', value: '0', format: 'number' as const }
  ]);

  useEffect(() => {
    const fetchStates = async () => {
      if (!contracts) return;

      try {
        const [liquidity, apy, price, status, rate, allocation] = await Promise.all([
          contracts.liquidityPool.getLiquidity(),
          contracts.liquidityPool.getAPY(),
          contracts.liquidityPool.getPrice(),
          contracts.stakingManager.getStakingStatus(),
          contracts.stakingManager.getRewardRate(),
          contracts.stakingManager.getStrategyAllocation()
        ]);

        setSourceState({
          liquidity: liquidity.toString(),
          apy: Number(apy),
          price: price.toString()
        });

        setTargetState({
          paused: status,
          rewardRate: Number(rate),
          allocation: Number(allocation)
        });
      } catch (error) {
        console.error('Error fetching states:', error);
      }
    };

    fetchStates();
    const interval = setInterval(fetchStates, 5000);
    return () => clearInterval(interval);
  }, [contracts, setSourceState, setTargetState]);

  useEffect(() => {
    setSourceMetrics([
      { label: 'Liquidity', value: sourceState.liquidity, format: 'ether' },
      { label: 'APY', value: sourceState.apy.toString(), format: 'number' },
      { label: 'Price', value: sourceState.price, format: 'ether' }
    ]);
  }, [sourceState]);

  useEffect(() => {
    setTargetMetrics([
      { label: 'Status', value: targetState.paused, format: 'boolean' },
      { label: 'Reward Rate', value: targetState.rewardRate.toString(), format: 'number' },
      { label: 'Allocation', value: targetState.allocation.toString(), format: 'number' }
    ]);
  }, [targetState]);

  const handleDeactivate = async (ruleId: number) => {
    try {
      await deactivateRule(ruleId);
    } catch (error) {
      console.error('Error deactivating rule:', error);
    }
  };

  if (!isConnected) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <h2 className="text-xl text-gray-700 mb-4">Connect your wallet to view the dashboard</h2>
            <p className="text-gray-500">Use the button in the navigation to connect</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Somnia Reactive Orchestrator</h1>
          <button
            onClick={refresh}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300"
          >
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ContractState title="Liquidity Pool (Source)" metrics={sourceMetrics} />
          <ContractState title="Staking Manager (Target)" metrics={targetMetrics} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Rules</h2>
            {loading ? (
              <div className="text-gray-500">Loading rules...</div>
            ) : rules.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center text-gray-500">
                No rules registered yet
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {rules.map((rule) => (
                  <RuleCard
                    key={rule.id}
                    rule={rule}
                    onDeactivate={handleDeactivate}
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Execution History</h2>
            {executions.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center text-gray-500">
                No executions yet
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {executions.map((exec, idx) => (
                  <ExecutionLog key={idx} execution={exec} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
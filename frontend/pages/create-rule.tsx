import React from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import CreateRuleForm from '../components/CreateRuleForm';
import { useContracts } from '../hooks/useContracts';
import { useOrchestrator } from '../hooks/useOrchestrator';

export default function CreateRulePage() {
  const router = useRouter();
  const { isConnected } = useContracts();
  const { registerRule, loading } = useOrchestrator();

  const handleSubmit = async (data: {
    source: string;
    eventSig: string;
    threshold: bigint;
    target: string;
    callData: string;
  }) => {
    try {
      await registerRule(
        data.source,
        data.eventSig,
        data.threshold,
        data.target,
        data.callData
      );
      router.push('/dashboard');
    } catch (error) {
      console.error('Error creating rule:', error);
    }
  };

  if (!isConnected) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <h2 className="text-xl text-gray-700 mb-4">Connect your wallet to create rules</h2>
            <p className="text-gray-500">Use the button in the navigation to connect</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Rule</h1>
        <CreateRuleForm onSubmit={handleSubmit} loading={loading} />
      </div>
    </Layout>
  );
}
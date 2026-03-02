import { useMemo, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useAccount } from 'wagmi';
import { contractAddresses } from '../utils/contractAddresses';
import { abis } from '../utils/abis';

export function useContracts() {
  const { address, isConnected } = useAccount();
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);

  const provider = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return new ethers.BrowserProvider(window.ethereum as any);
  }, []);

  // Get signer when provider and address are available
  useEffect(() => {
    const getSigner = async () => {
      if (!provider || !address) {
        setSigner(null);
        return;
      }
      try {
        const signerInstance = await provider.getSigner();
        setSigner(signerInstance);
      } catch (error) {
        console.error('Error getting signer:', error);
        setSigner(null);
      }
    };

    getSigner();
  }, [provider, address]);

  const contracts = useMemo(() => {
    if (!provider) return null;

    const liquidityPool = new ethers.Contract(
      contractAddresses.liquidityPool,
      abis.liquidityPool,
      provider
    );

    const stakingManager = new ethers.Contract(
      contractAddresses.stakingManager,
      abis.stakingManager,
      provider
    );

    const orchestrator = new ethers.Contract(
      contractAddresses.orchestrator,
      abis.orchestrator,
      provider
    );

    return {
      liquidityPool,
      stakingManager,
      orchestrator,
      getSignerContracts: () => {
        if (!signer) return null;
        return {
          liquidityPool: liquidityPool.connect(signer),
          stakingManager: stakingManager.connect(signer),
          orchestrator: orchestrator.connect(signer)
        };
      }
    };
  }, [provider, signer]);

  return {
    contracts,
    isConnected,
    address,
    signer
  };
}
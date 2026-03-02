import { useEffect, useState } from 'react';
import { SDK, WebsocketSubscriptionInitParams, SoliditySubscriptionData } from '@somnia-chain/reactivity';
import { createPublicClient, http, defineChain, Address } from 'viem';
import { SOMNIA_TESTNET_CONFIG } from '../utils/constants';

interface SourceState {
  liquidity: string;
  apy: number;
  price: string;
}

interface TargetState {
  paused: boolean;
  rewardRate: number;
  allocation: number;
}

interface Subscription {
  unsubscribe: () => void;
}

export function useReactivity() {
  const [sourceState, setSourceState] = useState<SourceState>({
    liquidity: '0',
    apy: 0,
    price: '0'
  });
  
  const [targetState, setTargetState] = useState<TargetState>({
    paused: false,
    rewardRate: 0,
    allocation: 0
  });

  const [sdk, setSdk] = useState<SDK | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  useEffect(() => {
    const somniaChain = defineChain({
      id: SOMNIA_TESTNET_CONFIG.chainId,
      name: SOMNIA_TESTNET_CONFIG.name,
      network: 'somnia-testnet',
      nativeCurrency: {
        decimals: 18,
        name: 'SOM',
        symbol: 'SOM'
      },
      rpcUrls: {
        default: { http: [SOMNIA_TESTNET_CONFIG.rpcUrl] }
      }
    });

    const publicClient = createPublicClient({
      chain: somniaChain,
      transport: http()
    });

    const sdkInstance = new SDK({
      public: publicClient
    });

    setSdk(sdkInstance);

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, []);

  const subscribeToEvents = (contractAddress: Address, events: string[], callback: (data: any) => void) => {
    if (!sdk) return null;

    const initParams: WebsocketSubscriptionInitParams = {
      ethCalls: events.map(event => ({
        to: contractAddress,
        data: event as `0x${string}`
      })),
      onData: callback
    };

    const subscription = sdk.subscribe(initParams);
    
    // Handle both sync and async subscriptions
    if (subscription instanceof Promise) {
      subscription.then(sub => {
        setSubscriptions(prev => [...prev, sub as Subscription]);
      });
      return subscription;
    } else {
      setSubscriptions(prev => [...prev, subscription as Subscription]);
      return subscription;
    }
  };

  const createSoliditySubscription = async (
    handlerContractAddress: Address,
    options: {
      priorityFeePerGas: bigint;
      maxFeePerGas: bigint;
      gasLimit: bigint;
      isGuaranteed: boolean;
      isCoalesced: boolean;
    }
  ) => {
    if (!sdk) throw new Error('SDK not initialized');

    const subscriptionData: SoliditySubscriptionData = {
      handlerContractAddress,
      priorityFeePerGas: options.priorityFeePerGas,
      maxFeePerGas: options.maxFeePerGas,
      gasLimit: options.gasLimit,
      isGuaranteed: options.isGuaranteed,
      isCoalesced: options.isCoalesced
    };

    return await sdk.createSoliditySubscription(subscriptionData);
  };

  return {
    sourceState,
    targetState,
    setSourceState,
    setTargetState,
    subscribeToEvents,
    createSoliditySubscription,
    isInitialized: sdk !== null
  };
}
import { useEffect, useState, useCallback } from 'react';
import { SDK, WebsocketSubscriptionInitParams } from '@somnia-chain/reactivity';
import {
  createPublicClient,
  http,
  defineChain,
  type Address,
} from 'viem';
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

const somniaChain = defineChain({
  id: SOMNIA_TESTNET_CONFIG.chainId,
  name: SOMNIA_TESTNET_CONFIG.name,
  network: 'somnia-testnet',
  nativeCurrency: { decimals: 18, name: 'SOM', symbol: 'SOM' },
  rpcUrls: {
    default: { http: [SOMNIA_TESTNET_CONFIG.rpcUrl] },
  },
});

export function useReactivity() {
  const [sourceState, setSourceState] = useState<SourceState>({
    liquidity: '0',
    apy: 0,
    price: '0',
  });

  const [targetState, setTargetState] = useState<TargetState>({
    paused: false,
    rewardRate: 0,
    allocation: 0,
  });

  const [sdk, setSdk] = useState<SDK | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  const initSDK = useCallback(() => {
    const publicClient = createPublicClient({
      chain: somniaChain,
      transport: http(),
    });
    const sdkInstance = new SDK({ public: publicClient });
    setSdk(sdkInstance);
  }, []);

  useEffect(() => {
    initSDK();
    return () => {
      subscriptions.forEach((sub) => sub.unsubscribe());
    };
  }, [initSDK]);

  // Off-chain WebSocket subscription (works fine from browser)
  const subscribeToEvents = (
    contractAddress: Address,
    events: string[],
    callback: (data: any) => void
  ) => {
    if (!sdk) return null;

    const initParams: WebsocketSubscriptionInitParams = {
      ethCalls: events.map((event) => ({
        to: contractAddress,
        data: event as `0x${string}`,
      })),
      onData: callback,
    };

    const subscription = sdk.subscribe(initParams);

    if (subscription instanceof Promise) {
      subscription.then((sub) => {
        setSubscriptions((prev) => [...prev, sub as Subscription]);
      });
      return subscription;
    } else {
      setSubscriptions((prev) => [...prev, subscription as Subscription]);
      return subscription;
    }
  };

  return {
    sourceState,
    targetState,
    setSourceState,
    setTargetState,
    subscribeToEvents,
    isInitialized: sdk !== null,
  };
}
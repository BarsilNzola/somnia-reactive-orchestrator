import { useEffect, useState, useCallback } from 'react';
import { SDK, WebsocketSubscriptionInitParams } from '@somnia-chain/reactivity';
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  defineChain,
  parseGwei,
  keccak256,
  toBytes,
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

  // Build SDK with both public + wallet client (wallet client required for createSoliditySubscription)
  const initSDK = useCallback(() => {
    if (typeof window === 'undefined' || !(window as any).ethereum) return;

    const publicClient = createPublicClient({
      chain: somniaChain,
      transport: http(),
    });

    // wallet client uses the browser wallet (MetaMask) — required by Somnia SDK
    const walletClient = createWalletClient({
      chain: somniaChain,
      transport: custom((window as any).ethereum),
    });

    const sdkInstance = new SDK({
      public: publicClient,
      wallet: walletClient,
    });

    setSdk(sdkInstance);
  }, []);

  useEffect(() => {
    initSDK();
    return () => {
      subscriptions.forEach((sub) => sub.unsubscribe());
    };
  }, [initSDK]);

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

  /**
   * Creates the Somnia Reactivity on-chain subscription.
   * This is what wires the emitter contract → handler contract via the Reactivity layer.
   * Must be called with a connected wallet that holds 32+ SOM.
   * 
   * @param handlerContractAddress - Your ReactiveOrchestrator address
   * @param emitterContractAddress - The contract whose events you want to watch (LiquidityPool)
   * @param eventSignature - Human-readable event e.g. "OraclePriceUpdated(uint256,uint256)"
   */
  const createSoliditySubscription = async (
    handlerContractAddress: Address,
    emitterContractAddress: Address,
    eventSignature: string
  ) => {
    if (!sdk) throw new Error('SDK not initialized — wallet not connected?');

    // Compute the full 32-byte keccak256 topic (NOT just 4 bytes)
    const eventTopic = keccak256(toBytes(eventSignature));

    const txHash = await sdk.createSoliditySubscription({
      handlerContractAddress,
      emitter: emitterContractAddress,        // only fire for this specific contract
      eventTopics: [eventTopic],              // only fire for this specific event
      priorityFeePerGas: parseGwei('2'),      // docs use parseGwei, not raw bigint
      maxFeePerGas: parseGwei('10'),
      gasLimit: 500_000n,
      isGuaranteed: true,                     // retry on failure
      isCoalesced: false,                     // fire on every event
    });

    if (txHash instanceof Error) {
      throw new Error(`Subscription creation failed: ${txHash.message}`);
    }

    return txHash;
  };

  return {
    sourceState,
    targetState,
    setSourceState,
    setTargetState,
    subscribeToEvents,
    createSoliditySubscription,
    isInitialized: sdk !== null,
    reinitSDK: initSDK,
  };
}
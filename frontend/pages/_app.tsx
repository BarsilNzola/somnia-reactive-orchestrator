import type { AppProps } from 'next/app';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SOMNIA_TESTNET_CONFIG } from '../utils/constants';
import '../styles/globals.css';

const somniaTestnet = {
  id: SOMNIA_TESTNET_CONFIG.chainId,
  name: SOMNIA_TESTNET_CONFIG.name,
  nativeCurrency: { name: 'SOM', symbol: 'SOM', decimals: 18 },
  rpcUrls: {
    default: { http: [SOMNIA_TESTNET_CONFIG.rpcUrl] }
  }
} as const;

// Create config with the latest API
const config = createConfig({
  chains: [somniaTestnet],
  connectors: [injected()],
  transports: {
    [somniaTestnet.id]: http()
  }
});

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Component {...pageProps} />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
import { ChakraProvider } from "@chakra-ui/react";
import { GasPrice } from "@cosmjs/stargate";
import { wallets as cosmostationWallets } from "@cosmos-kit/cosmostation";
import { wallets as keplrWallets } from "@cosmos-kit/keplr";
import { wallets as leapWallets } from "@cosmos-kit/leap";
import { ChainProvider } from "@cosmos-kit/react";
import { Chain } from "@chain-registry/types";
import { chains, assets } from "chain-registry";
import { AppProps } from "next/app";

import Layout from "../components/Layout";
import { NETWORK_CONFIG } from "../configs";
import theme from "../theme";

const BadgesApp = ({ Component, pageProps }: AppProps) => {
  // gas price must be set in order to use auto gas
  const signerOptions = {
    signingCosmwasm: (chain: Chain) => {
      if (chain.chain_name === NETWORK_CONFIG.name) {
        return {
          gasPrice: GasPrice.fromString("1ustars"),
        }
      }

      return undefined;
    },
  }

  const walletConnectOptions = {
    signClient: {
      projectId: "51370e1183449abe68a677991c158c7b",
      relayUrl: "wss://relay.walletconnect.org",
      metadata: {
        name: "Badges",
        description: "Badge claim webapp",
        url: "https://app.badges.fun",
        icons: [],
      },
    },
  };

  return (
    <ChakraProvider theme={theme}>
      <ChainProvider
        chains={chains}
        assetLists={assets}
        wallets={[...cosmostationWallets, ...keplrWallets, ...leapWallets]}
        wrappedWithChakra={true}
        signerOptions={signerOptions}
        walletConnectOptions={walletConnectOptions}
      >
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </ChainProvider>
    </ChakraProvider>
  );
};

export default BadgesApp;

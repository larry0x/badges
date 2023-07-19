import { ChakraProvider } from "@chakra-ui/react";
import { GasPrice } from "@cosmjs/stargate";
import { wallets as keplrWallets } from "@cosmos-kit/keplr";
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
  return (
    <ChakraProvider theme={theme}>
      <ChainProvider
        chains={chains}
        assetLists={assets}
        wallets={[...keplrWallets]}
        wrappedWithChakra={true}
        signerOptions={signerOptions}
      >
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </ChainProvider>
    </ChakraProvider>
  );
};

export default BadgesApp;

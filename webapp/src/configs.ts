// TODO
export const CHAIN_NAME = "stargazetestnet";

export enum Network {
  Mainnet = "mainnet",
  Testnet = "testnet",
  Localhost = "localhost",
}

export type NetworkConfig = {
  // chain info
  name: string;
  chainId: string;
  prefix: string;
  rpcUrl: string;
  // gas settings
  gas?: number;
  gasAdjustment: number;
  gasPrices: string;
  // contract addresses
  hub: string;
  nft: string;
  // a function that takes a txhash and returns a block explorer URL showing this tx
  getExplorerUrl(txhash: string): string;
};

export const NETWORK_CONFIGS: { [key in Network]: NetworkConfig } = {
  [Network.Mainnet]: {
    name: "mainnet",
    chainId: "stargaze-1",
    prefix: "stars",
    rpcUrl: "https://rpc.stargaze-apis.com:443",
    gas: undefined,
    gasAdjustment: 1.4,
    gasPrices: "0ustars",
    hub: "stars13unm9tgtwq683wplupjlgw39nghm7xva7tmu7m29tmpxxnkhpkcq4gf3p4",
    nft: "stars1z5qcmx9frn2y92cjy3k62gzylkezkphdwrx3675mvug3fd9l26fshdd85t",
    getExplorerUrl: (txhash: string) => `https://www.mintscan.io/stargaze/txs/${txhash}`,
  },
  [Network.Testnet]: {
    name: "testnet",
    chainId: "elgafar-1",
    prefix: "stars",
    rpcUrl: "https://rpc.elgafar-1.stargaze-apis.com:443",
    gas: undefined,
    gasAdjustment: 1.4,
    gasPrices: "0ustars",
    hub: "stars1dacun0xn7z73qzdcmq27q3xn6xuprg8e2ugj364784al2v27tklqynhuqa",
    nft: "stars1vlw4y54dyzt3zg7phj8yey9fg4zj49czknssngwmgrnwymyktztstalg7t",
    getExplorerUrl: (txhash: string) =>
      `https://stargaze-testnet-explorer.pages.dev/stargaze/tx/${txhash}`,
  },
  [Network.Localhost]: {
    name: "local",
    chainId: "stars-dev-1",
    prefix: "stars",
    rpcUrl: "http://localhost:26657",
    gas: undefined,
    gasAdjustment: 1.4,
    gasPrices: "0ustars",
    hub: "stars14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9srsl6sm",
    nft: "stars1nc5tatafv6eyq7llkr2gv50ff9e22mnf70qgjlv737ktmt4eswrq096cja",
    getExplorerUrl: (_txhash: string) => "", // there's no explorer for localhost
  },
};

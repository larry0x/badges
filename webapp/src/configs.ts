// default to testnet
export const NETWORK_CONFIG = process.env["NETWORK"] === "mainnet" ? {
  name: "stargaze",
  hub: "stars13unm9tgtwq683wplupjlgw39nghm7xva7tmu7m29tmpxxnkhpkcq4gf3p4",
  getExplorerUrl: (txhash: string) => `https://www.mintscan.io/stargaze/txs/${txhash}`,
} : {
  name: "stargazetestnet",
  hub: "stars1dacun0xn7z73qzdcmq27q3xn6xuprg8e2ugj364784al2v27tklqynhuqa",
  getExplorerUrl: (txhash: string) => `https://stargaze-testnet-explorer.pages.dev/stargaze/tx/${txhash}`,
}

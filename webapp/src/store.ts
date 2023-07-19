import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { create } from "zustand";

import { Network, NetworkConfig, NETWORK_CONFIGS } from "./configs";
import { BadgeResponse, ConfigResponse, KeyResponse, OwnerResponse } from "./types";

export type State = {
  networkConfig?: NetworkConfig;

  wasmClient?: CosmWasmClient;

  badgeCount?: number;
  badges: { [key: number]: BadgeResponse };

  init: () => Promise<void>;
  getBadge: (id: number) => Promise<BadgeResponse>;
  isKeyWhitelisted: (id: number, privkeyStr: string) => Promise<boolean>;
  isOwnerEligible: (id: number, owner: string) => Promise<boolean>;
};

export const useStore = create<State>((set) => ({
  badges: {},

  init: async () => {
    const network = process.env["NETWORK"] ?? Network.Testnet;
    const networkConfig = NETWORK_CONFIGS[network as Network];

    console.log("using network:", network);
    console.log("network config:", networkConfig);

    const wasmClient = await CosmWasmClient.connect(networkConfig.rpcUrl);

    console.log("created wasm client with RPC URL", networkConfig.rpcUrl);

    const configRes: ConfigResponse = await wasmClient.queryContractSmart(networkConfig.hub, {
      config: {},
    });

    console.log("fetched badge count:", configRes.badge_count);

    return set({
      networkConfig,
      wasmClient,
      badgeCount: configRes.badge_count,
    });
  },

  getBadge: async function (id: number) {
    if (!(id in this.badges)) {
      this.badges[id] = await this.wasmClient!.queryContractSmart(this.networkConfig!.hub, {
        badge: {
          id,
        },
      });

      set({ badges: this.badges });
    }
    return this.badges[id]!;
  },

  // NOTE: unlike with getBadge, we don't cache the result in the store, because it the user submits
  // a successful mint tx, the eligibility of the key changes
  isKeyWhitelisted: async function (id: number, privkeyStr: string) {
    const keyRes: KeyResponse = await this.wasmClient!.queryContractSmart(this.networkConfig!.hub, {
      key: {
        id,
        pubkey: privkeyStr,
      },
    });
    return keyRes.whitelisted;
  },

  // NOTE: unlike with getBadge, we don't cache the result in the store, because it the user submits
  // a successful mint tx, the eligibility of the owner address changes
  isOwnerEligible: async function (id: number, owner: string) {
    const ownerRes: OwnerResponse = await this.wasmClient!.queryContractSmart(
      this.networkConfig!.hub,
      {
        owner: {
          id,
          user: owner,
        },
      }
    );
    return !ownerRes.claimed; // the address is eligible if it has NOT claimed
  },
}));

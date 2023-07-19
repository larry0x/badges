import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { create } from "zustand";

import { NETWORK_CONFIG } from "./configs";
import { BadgeResponse, ConfigResponse, KeyResponse, OwnerResponse } from "./types";

export type State = {
  badgeCount?: number;
  badges: { [key: number]: BadgeResponse };

  init: (wasmClient: CosmWasmClient) => Promise<void>;
  getBadge: (wasmClient: CosmWasmClient, id: number) => Promise<BadgeResponse>;
  isKeyWhitelisted: (wasmClient: CosmWasmClient, id: number, privkeyStr: string) => Promise<boolean>;
  isOwnerEligible: (wasmClient: CosmWasmClient, id: number, owner: string) => Promise<boolean>;
};

export const useStore = create<State>((set) => ({
  badges: {},

  init: async (wasmClient: CosmWasmClient) => {
    const configRes: ConfigResponse = await wasmClient.queryContractSmart(
      NETWORK_CONFIG.hub,
      {
        config: {},
      },
    );

    return set({ badgeCount: configRes.badge_count });
  },

  getBadge: async function (wasmClient: CosmWasmClient, id: number) {
    if (!(id in this.badges)) {
      this.badges[id] = await wasmClient.queryContractSmart(
        NETWORK_CONFIG.hub,
        {
          badge: {
            id,
          },
        },
      );

      set({ badges: this.badges });
    }

    return this.badges[id]!;
  },

  isKeyWhitelisted: async function (wasmClient: CosmWasmClient, id: number, privkeyStr: string) {
    const keyRes: KeyResponse = await wasmClient.queryContractSmart(
      NETWORK_CONFIG.hub,
      {
        key: {
          id,
          pubkey: privkeyStr,
        },
      },
    );

    return keyRes.whitelisted;
  },

  isOwnerEligible: async function (wasmClient: CosmWasmClient, id: number, owner: string) {
    const ownerRes: OwnerResponse = await wasmClient.queryContractSmart(
      NETWORK_CONFIG.hub,
      {
        owner: {
          id,
          user: owner,
        },
      }
    );

    // the address is eligible if it has NOT claimed
    return !ownerRes.claimed;
  },
}));

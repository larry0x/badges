import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";

import { NETWORK_CONFIG } from "./configs";
import { BadgeResponse, ConfigResponse, KeyResponse, OwnerResponse } from "./types";

export async function queryBadgeCount(client: CosmWasmClient) {
  const configRes: ConfigResponse = await client.queryContractSmart(
    NETWORK_CONFIG.hub,
    {
      config: {},
    },
  );

  return configRes["badge_count"];
}

export async function queryBadge(client: CosmWasmClient, id: number) {
  const badgeRes: BadgeResponse = await client.queryContractSmart(
    NETWORK_CONFIG.hub,
    {
      badge: {
        id,
      }
    },
  );

  return badgeRes;
}

export async function isKeyWhitelisted(client: CosmWasmClient, id: number, privkeyStr: string) {
  const keyRes: KeyResponse = await client!.queryContractSmart(
    NETWORK_CONFIG.hub,
    {
      key: {
        id,
        pubkey: privkeyStr,
      },
    },
  );

  return keyRes.whitelisted;
}

export async function isOwnerEligible(client: CosmWasmClient, id: number, owner: string) {
  const ownerRes: OwnerResponse = await client!.queryContractSmart(
    NETWORK_CONFIG.hub,
    {
      owner: {
        id,
        user: owner,
      },
    },
  );

  // the address is eligible if it has NOT claimed
  return !ownerRes.claimed;
}

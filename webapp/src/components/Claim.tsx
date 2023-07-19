import {
  useDisclosure,
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Image,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useChain } from "@cosmos-kit/react";
import { TxRaw } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import { MsgExecuteContract } from "cosmjs-types/cosmwasm/wasm/v1/tx";
import { useEffect, useState } from "react";
import * as secp256k1 from "secp256k1";

import TxModal from "./TxModal";
import WalletSection from "./WalletSection";
import { NETWORK_CONFIG } from "../configs";
import { getTimestampInSeconds, formatTimestamp, sha256, hexToBytes, bytesToHex } from "../helpers";
import { useStore } from "../store";
import { BadgeResponse } from "../types";

const fillerImageUrl = "https://via.placeholder.com/500?text=Image+Not+Available";
const fillerText = "Undefined";

enum Page {
  Credential = 1,
  Preview,
  Submit,
}

export default function Claim() {
  const store = useStore();
  const { disconnect, address, getCosmWasmClient, sign } = useChain(NETWORK_CONFIG.name);

  // which page to display
  const [page, setPage] = useState(Page.Credential);

  // inputs - badge id
  const [idStr, setIdStr] = useState("");
  const [idValid, setIdValid] = useState<boolean | null>(null);
  const [idInvalidReason, setIdInvalidReason] = useState("");

  // inputs - key
  const [privkeyStr, setPrivkeyStr] = useState("");
  const [privkeyValid, setPrivkeyValid] = useState<boolean | null>(null);
  const [privkeyInvalidReason, setPrivkeyInvalidReason] = useState("");

  // inputs - owner
  const [ownerValid, setOwnerValid] = useState<boolean | null>(null);
  const [ownerInvalidReason, setOwnerInvalidReason] = useState("");

  // tx broadcasting
  const [tx, setTx] = useState<TxRaw | null>(null);
  const [spin, setSpin] = useState<boolean>(false);
  const { isOpen: isTxModalOpen, onOpen: onTxModalOpen, onClose: onTxModalClose } = useDisclosure();

  // values on the preview page
  const [badge, setBadge] = useState<BadgeResponse>();

  // whenever input id is changed, validate it
  useEffect(() => {
    function setIdValidNull() {
      setIdValid(null);
      setIdInvalidReason("");
      console.log("empty id");
    }

    function setIdValidTrue() {
      setIdValid(true);
      setIdInvalidReason("");
      console.log(`id "${idStr}" is valid`);
    }

    function setIdValidFalse(reason: string) {
      setIdValid(false);
      setIdInvalidReason(reason);
      console.log(`invalid id "${idStr}": ${reason}`);
    }

    //--------------------
    // stateless checks
    //--------------------

    if (idStr === "") {
      return setIdValidNull();
    }

    const id = Number(idStr);

    if (!Number.isInteger(id)) {
      return setIdValidFalse("id must be an integer!");
    }

    if (id < 1) {
      return setIdValidFalse("id cannot be zero!");
    }

    if (!!store.badgeCount && id > store.badgeCount) {
      return setIdValidFalse(
        `id cannot be greater than the current badge count! (count: ${store.badgeCount})`
      );
    }

    //--------------------
    // stateful checks
    //--------------------

    getCosmWasmClient().then((wasmClient) => {
      store.getBadge(wasmClient, id).then((badge) => {
        if (badge.rule !== "by_keys" && !("by_key" in badge.rule)) {
          return setIdValidFalse("id is valid but this badge is not publicly mintable!");
        }

        if (badge.expiry && getTimestampInSeconds() > badge.expiry) {
          return setIdValidFalse(
            `id is valid but minting deadline has already elapsed! (deadline: ${formatTimestamp(
              badge.expiry
            )})`
          );
        }

        if (badge.max_supply && badge.current_supply >= badge.max_supply) {
          return setIdValidFalse(
            `id is valid but max supply has already been reached! (max supply: ${badge.max_supply})`
          );
        }

        return setIdValidTrue();
      });
    });
  }, [idStr]);

  // whenever input key is changed, we need to validate it
  useEffect(() => {
    function setPrivkeyValidNull() {
      setPrivkeyValid(null);
      setPrivkeyInvalidReason("");
      console.log("empty key");
    }

    function setPrivkeyValidTrue() {
      setPrivkeyValid(true);
      setPrivkeyInvalidReason("");
      console.log(`key "${privkeyStr}" is valid`);
    }

    function setPrivkeyValidFalse(reason: string) {
      setPrivkeyValid(false);
      setPrivkeyInvalidReason(reason);
      console.log(`invalid key "${privkeyStr}": ${reason}`);
    }

    //--------------------
    // stateless checks
    //--------------------

    if (privkeyStr === "") {
      return setPrivkeyValidNull();
    }

    const bytes = Buffer.from(privkeyStr, "hex");

    // A string is a valid hex-encoded bytearray if it can be decoded to a Buffer, and the string
    // has exactly twice as many bytes as the number of the Buffer's bytes.
    if (bytes.length * 2 != privkeyStr.length) {
      return setPrivkeyValidFalse("not a valid hex string!");
    }

    try {
      if (!secp256k1.privateKeyVerify(bytes)) {
        return setPrivkeyValidFalse("not a valid secp256k1 private key!");
      }
    } catch (err) {
      return setPrivkeyValidFalse(`not a valid secp256k1 private key: ${err}`);
    }

    //--------------------
    // stateful checks
    //--------------------

    // Now we know the key is a valid secp256k1 privkey, we need to check whether it is eligible for
    // claiming the badge.
    // Firstly, if we don't already have a valid badge id, it's impossible to determine to badge's
    // eligibility. Simply return null in this case.
    if (!!!idValid) {
      return setPrivkeyValidNull();
    }

    const pubkeyStr = bytesToHex(secp256k1.publicKeyCreate(hexToBytes(privkeyStr)));

    // this block of code is fucking atrocious, but "it just works"
    getCosmWasmClient().then((wasmClient) => {
      store.getBadge(wasmClient, Number(idStr)).then((badge) => {
        if (badge.rule === "by_keys") {
          store
            .isKeyWhitelisted(wasmClient, Number(idStr), pubkeyStr)
            .then((isWhitelisted) => {
              if (isWhitelisted) {
                return setPrivkeyValidTrue();
              } else {
                return setPrivkeyValidFalse(`this key is not eligible to claim badge #${idStr}`);
              }
            })
            .catch((err) => {
              return setPrivkeyValidFalse(
                `failed to check this key's eligibility to claim badge #${idStr}: ${err}`
              );
            });
        } else if ("by_key" in badge.rule) {
          if (pubkeyStr === badge.rule["by_key"]) {
            return setPrivkeyValidTrue();
          } else {
            return setPrivkeyValidFalse(`this key is not eligible to claim badge #${idStr}`);
          }
        } else {
          return setPrivkeyValidFalse(`this key is not eligible to claim badge #${idStr}`);
        }
      });
    })
  }, [privkeyStr, idStr, idValid]);

  // whenver input owner address is changed, we need to validate it
  useEffect(() => {
    function setOwnerValidNull() {
      setOwnerValid(null);
      setOwnerInvalidReason("");
      console.log("empty key");
    }

    function setOwnerValidTrue() {
      setOwnerValid(true);
      setOwnerInvalidReason("");
      console.log(`key "${privkeyStr}" is valid`);
    }

    function setOwnerValidFalse(reason: string) {
      setOwnerValid(false);
      setOwnerInvalidReason(reason);
      console.log(`invalid key "${privkeyStr}": ${reason}`);
    }

    //--------------------
    // stateless checks
    //--------------------

    if (!address) {
      return setOwnerValidNull();
    }

    //--------------------
    // stateful checks
    //--------------------

    // Now we know the owner is a valid bech32 address, we need to check whether it is eligible for
    // claiming the badge.
    // Firstly, if we don't already have a valid badge id, it's impossible to determine to badge's
    // eligibility. Simply return null in this case.
    if (!!!idValid) {
      return setOwnerValidNull();
    }

    getCosmWasmClient().then((wasmClient) => {
      store
        .isOwnerEligible(wasmClient, Number(idStr), address)
        .then((eligible) => {
          if (eligible) {
            return setOwnerValidTrue();
          } else {
            return setOwnerValidFalse(`this address is not eligible to claim badge #${idStr}`);
          }
        })
        .catch((err) => {
          return setOwnerValidFalse(
            `failed to check this address' eligibility to claim badge #${idStr}: ${err}`
          );
        });
    })
  }, [address, idStr, idValid]);

  // if the id has been updated, we need to update the metadata displayed on the preview page
  // only update if the id is valid AND wasm client has been initialized
  useEffect(() => {
    if (!idValid) {
      console.log(`invalid badge id "${idStr}", setting badge to undefined`);
      return setBadge(undefined);
    }

    getCosmWasmClient().then((wasmClient) => {
      store
        .getBadge(wasmClient, Number(idStr))
        .then((badge) => {
          console.log(`successfully fetched badge with id "${idStr}"! badge:`, badge);
          setBadge(badge);
        })
        .catch((err) => {
          console.log(`failed to fetch badge with id "${idStr}"! reason:`, err);
          setBadge(undefined);
        });
    })
  }, [idStr, idValid]);

  // when the component is first mounted, we check the URL query params and auto-fill id and key
  useEffect(() => {
    const url = window.location.href;
    const split = url.split("?");
    const params = new URLSearchParams(split[1]);
    setIdStr(params.get("id") ?? "");
    setPrivkeyStr(params.get("key") ?? "");
  }, []);

  // if image url starts with `ipfs://...`, we grab the CID and return it with Larry's pinata gateway
  // otherwise, we return the url unmodified
  function parseImageUrl(url: string) {
    const ipfsPrefix = "ipfs://";
    if (url.startsWith(ipfsPrefix)) {
      const cid = url.slice(ipfsPrefix.length);
      return `https://ipfs-gw.stargaze-apis.com/ipfs/${cid}`;
    } else {
      return url;
    }
  }

  // when the submit button is clicked: sign the tx, then open tx modal to
  // broadcast it
  async function submitTx() {
    console.log("composing and submitting tx!!");

    // generate the signature
    const privKey = Buffer.from(privkeyStr, "hex");
    const msg = `claim badge ${idStr} for user ${address}`;
    const msgBytes = Buffer.from(msg, "utf8");
    const msgHashBytes = sha256(msgBytes);
    const { signature } = secp256k1.ecdsaSign(msgHashBytes, privKey);

    // generate the contract execute msg
    let executeMsg: object;
    const badge = await store.getBadge(await getCosmWasmClient(), Number(idStr));
    if (badge.rule === "by_keys") {
      executeMsg = {
        mint_by_keys: {
          id: Number(idStr),
          owner: address,
          pubkey: Buffer.from(secp256k1.publicKeyCreate(privKey)).toString("hex"),
          signature: Buffer.from(signature).toString("hex"),
        },
      };
    } else if ("by_key" in badge.rule) {
      executeMsg = {
        mint_by_key: {
          id: Number(idStr),
          owner: address,
          signature: Buffer.from(signature).toString("hex"),
        },
      };
    } else {
      throw "unsupported minting mode";
    }
    const executeMsgStr = JSON.stringify(executeMsg);
    console.log("compose executeMsg:", executeMsgStr);
    const executeMsgBytes = Buffer.from(executeMsgStr, "utf8");

    // wrap the executeMsg in an MsgExecuteContract
    // not sure what's the idiomatic way to do it, but this works
    const sdkMsg = {
      typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
      value: MsgExecuteContract.fromPartial({
        sender: address,
        contract: NETWORK_CONFIG.hub,
        msg: executeMsgBytes,
        funds: [],
      }),
    };

    // sign & broadcast the msg
    // two important points:
    // - to use auto gas, the gas price must be set (in _app.tsx)
    // - must use the cosmwas client (otherwise, will get "unknown message:
    //   /cosmwas.wasm.v1.MsgExecuteContract" error)
    try {
      setSpin(true);
      const tx = await sign([sdkMsg], undefined, undefined, "cosmwasm");
      setTx(tx);
      onTxModalOpen();
    } catch {
      setSpin(false);
    }
  }

  // when user closes the tx modal, we reset the page: revert back to the credentials page,
  // empty the inputs, disconnect the wallet
  function onClosingTxModal() {
    setPage(Page.Credential);
    setIdStr("");
    setIdValid(null);
    setPrivkeyStr("");
    setPrivkeyValid(null);
    setOwnerValid(null);
    setSpin(false);
    setTx(null);
    disconnect();
    onTxModalClose();
  }

  const credentialPage = (
    <Box>
      <Text mb="4">1️⃣ Enter your claim credentials</Text>
      <FormControl mb="4" isInvalid={idValid !== null && !idValid}>
        <FormLabel>id</FormLabel>
        <Input
          placeholder="a number"
          value={idStr}
          onChange={(event) => {
            setIdStr(event.target.value);
          }}
        />
        {idValid !== null ? (
          idValid ? (
            <FormHelperText>✅ valid id</FormHelperText>
          ) : (
            <FormErrorMessage>{idInvalidReason}</FormErrorMessage>
          )
        ) : null}
      </FormControl>
      <FormControl mb="4" isInvalid={privkeyValid !== null && !privkeyValid}>
        <FormLabel>key</FormLabel>
        <Input
          placeholder="hex-encoded string"
          value={privkeyStr}
          onChange={(event) => {
            setPrivkeyStr(event.target.value);
          }}
        />
        {privkeyValid !== null ? (
          privkeyValid ? (
            <FormHelperText>✅ valid key</FormHelperText>
          ) : (
            <FormErrorMessage>{privkeyInvalidReason}</FormErrorMessage>
          )
        ) : null}
      </FormControl>
      <Button
        variant="outline"
        onClick={() => setPage(Page.Preview)}
        isDisabled={!(!!idValid && !!privkeyValid)}
      >
        Next
      </Button>
    </Box>
  );

  const previewPage = (
    <Box>
      <Text mb="4">2️⃣ Preview of your badge</Text>
      <Image
        src={parseImageUrl(badge?.metadata.image ?? fillerImageUrl)}
        alt="badge-image"
        w="100%"
        mx="auto"
        mb="4"
        border="1px solid rgb(226, 232, 240)"
        borderRadius="xl"
      />
      <VStack alignItems="start" mb="4">
        <Box>
          <Text fontSize="sm" fontWeight="400">
            name
          </Text>
          <Text>{badge?.metadata.name ?? fillerText}</Text>
        </Box>
        <Box>
          <Text fontSize="sm" fontWeight="400">
            description
          </Text>
          <Text lineHeight="1.25" py="1">
            {badge?.metadata.description ?? fillerText}
          </Text>
        </Box>
        <Box>
          <Text fontSize="sm" fontWeight="400">
            current supply
          </Text>
          <Text>{badge?.current_supply ?? fillerText}</Text>
        </Box>
        <Box>
          <Text fontSize="sm" fontWeight="400">
            max supply
          </Text>
          <Text>{badge ? badge.max_supply ?? "No max supply" : fillerText}</Text>
        </Box>
        <Box>
          <Text fontSize="sm" fontWeight="400">
            minting deadline
          </Text>
          <Text>
            {badge ? (badge.expiry ? formatTimestamp(badge.expiry) : "No deadline") : fillerText}
          </Text>
        </Box>
      </VStack>
      <Button variant="outline" mr="1" onClick={() => setPage(Page.Credential)}>
        Back
      </Button>
      <Button variant="outline" ml="1" onClick={() => setPage(Page.Submit)}>
        Next
      </Button>
    </Box>
  );

  const submitPage = (
    <Box>
      <Text mb="4">3️⃣ Claim now!</Text>
      <WalletSection />
      <Box mb="5">
        {ownerValid ? (
          <Box textColor="green">You are eligible to claim this badge!</Box>
        ) : (
          <Box textColor="red">{ownerInvalidReason}</Box>
        )}
      </Box>
      <Button variant="outline" mr="1" onClick={() => setPage(Page.Preview)}>
        Back
      </Button>
      {
        ownerValid ? (
          <Button
            variant="outline"
            colorScheme="green"
            ml="1"
            onClick={submitTx}
            isLoading={spin}
          >
            Submit
          </Button>
        ) : null
      }
      <TxModal tx={tx!} isOpen={isTxModalOpen} onClose={onClosingTxModal} />
    </Box>
  );

  const pages = {
    [Page.Credential]: credentialPage,
    [Page.Preview]: previewPage,
    [Page.Submit]: submitPage,
  };

  return <Box px="2">{pages[page]}</Box>;
}

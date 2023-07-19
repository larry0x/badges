import { Box, Button, Flex, Link, Spinner, Text } from "@chakra-ui/react";
import { TxRaw } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import { useChain } from "@cosmos-kit/react";
import { FC, useState, useEffect } from "react";

import ModalWrapper from "./ModalWrapper";
import SuccessIcon from "./TxSuccessIcon";
import FailedIcon from "./TxFailedIcon";
import ExternalLinkIcon from "./ExternalLinkIcon";
import { NETWORK_CONFIG } from "../configs";
import { truncateString } from "../helpers";

function SpinnerWrapper() {
  return (
    <Spinner thickness="6px" speed="1s" emptyColor="transparent" color="brand.red" size="xl" />
  );
}

function TxHashText(txhash: string, url: string) {
  return (
    <Flex>
      <Text variant="dimmed" ml="auto" mr="3">
        Tx Hash
      </Text>
      <Link isExternal href={url} ml="3" mr="auto" my="auto" textUnderlineOffset="0.3rem">
        {truncateString(txhash, 6, 6)}
        <ExternalLinkIcon
          ml="2"
          style={{
            transform: "translateY(-2.4px)",
          }}
        />
      </Link>
    </Flex>
  );
}

function TxFailedText(error: any) {
  return (
    <Text mx="auto" px="12">
      {error}
    </Text>
  );
}

function CloseButton(showCloseBtn: boolean, onClick: () => void) {
  return showCloseBtn ? (
    <Button variant="outline" mt="12" onClick={onClick}>
      Close
    </Button>
  ) : null;
}

type Props = {
  tx: TxRaw,
  isOpen: boolean;
  onClose: () => void;
};

const TxModal: FC<Props> = ({ tx, isOpen, onClose }) => {
  const { broadcast } = useChain(NETWORK_CONFIG.name);

  const [showCloseBtn, setShowCloseBtn] = useState<boolean>(false);
  const [txStatusHeader, setTxStatusHeader] = useState<string>();
  const [txStatusIcon, setTxStatusIcon] = useState<JSX.Element>();
  const [txStatusDetail, setTxStatusDetail] = useState<JSX.Element>();

  useEffect(() => {
    setTxStatusHeader("Broadcasting Transaction...");
    setTxStatusIcon(SpinnerWrapper());
    setTxStatusDetail(<Text>Should be done in a few seconds 😉</Text>);
    setShowCloseBtn(false);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      console.log("tx modal is opened. attempting to broadcast tx");
      broadcast(tx, "cosmwasm")
        .then((result) => {
          setTxStatusHeader("Transaction Successful");
          setTxStatusDetail(
            TxHashText(
              result.transactionHash,
              NETWORK_CONFIG.getExplorerUrl(result.transactionHash)
            )
          );
          setTxStatusIcon(<SuccessIcon h="80px" w="80px" />);
          setShowCloseBtn(true);
        })
        .catch((error) => {
          setTxStatusHeader("Transaction Failed");
          setTxStatusIcon(<FailedIcon h="80px" w="80px" />);
          setTxStatusDetail(TxFailedText(error));
          setShowCloseBtn(true);
        });
    }
  }, [isOpen]);

  return (
    <ModalWrapper showHeader={false} isOpen={isOpen} onClose={onClose}>
      <Box w="100%" textAlign="center">
        <Text fontSize="xl" textStyle="minibutton" mt="10">
          {txStatusHeader}
        </Text>
        <Flex w="100%" h="150px" align="center" justify="center">
          {txStatusIcon}
        </Flex>
        <Box mt="3" mb="10">
          {txStatusDetail}
          {CloseButton(showCloseBtn, onClose)}
        </Box>
      </Box>
    </ModalWrapper>
  );
};

export default TxModal;

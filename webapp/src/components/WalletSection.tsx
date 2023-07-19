import { Box, Button, Center, HStack } from '@chakra-ui/react';
import { useChain } from '@cosmos-kit/react';
import { MouseEventHandler } from 'react';

import { CHAIN_NAME } from '../configs';

export default function WalletSection() {
  const { connect, disconnect, address, isWalletConnected } = useChain(CHAIN_NAME);

  const onClickConnect: MouseEventHandler = async (e) => {
    e.preventDefault();
    console.log("attempting to connect wallet...");
    await connect();
    console.log("wallet connected!");
  };

  const onClickDisconnect: MouseEventHandler = (e) => {
    e.preventDefault();
    console.log("attempting to disconnect wallet...");
    disconnect();
    console.log("wallet disconnected!");
  };

  const connectButton = (
    <Button variant="outline" onClick={onClickConnect}>
      Connect Keplr wallet
    </Button>
  );

  // a little css hack to make a "button group"
  const disconnectButton = (
    <HStack spacing="0">
      <Center
        h="10"
        px="4"
        border="1px solid var(--chakra-colors-gray-200)"
        borderRight="0px"
        borderLeftRadius="md"
      >
        {address}
      </Center>
      <Button variant="outline" onClick={onClickDisconnect} borderLeftRadius="0">
        Disconnect
      </Button>
    </HStack>
  );

  return (
    <Box mb="2">
      {isWalletConnected ? disconnectButton : connectButton}
    </Box>
  );
}

import { Box, HStack, Image, Link } from "@chakra-ui/react";

export default function Footer() {
  return (
    <Box mt="6">
      <hr />
      <HStack mt="2" mb="4" px="2" color="gray.600" fontSize="sm">
        <Image src="larry.png" boxSize="25px" alt="larry" />
        <Box>
          Badges is a{" "}
          <Link fontWeight="700" href="https://larry.engineer">
            larry0x
          </Link>{" "}
          project
        </Box>
        <Box>
          👉{" "}
          <Link fontWeight="700" href="https://github.com/public-awesome/badges">
            source code on GitHub
          </Link>
        </Box>
      </HStack>
    </Box>
  );
}

import { Box, Heading, HStack, Image, Link } from "@chakra-ui/react";

export default function Navbar() {
  return (
    <Box w="100%" mb="4">
      <HStack pl="2" py="4">
        <Link
          isExternal={true}
          href="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
          // Wiggle animation is defined in the style tag in `../pages/_document.tsx`
          // See: https://stackoverflow.com/questions/38132700/css-wiggle-shake-effect
          animation="wiggle 2.5s infinite"
        >
          <Image
            src="badges.gif"
            alt="logo"
            w="50px"
            h="60px"
            borderRadius="0"
            transition="0.1s all"
            _hover={{
              transform: "scale(1.1)",
            }}
          />
        </Link>
        <Heading fontSize="3xl" fontFamily="Silkscreen" pt="2">
          Badges
        </Heading>
      </HStack>
      <hr />
    </Box>
  );
}

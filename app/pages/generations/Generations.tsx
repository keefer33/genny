import { Box, Container } from "@mantine/core";
import PlayGroundRunHistory from "../playground/PlayGroundRunHistory";

export default function Generations() {
  return (
    <Container size="lg" p="0">
      <Box
        h="calc(100dvh - var(--app-shell-header-height, 0px) - var(--app-shell-footer-height, 0px))"
        style={{ minHeight: 0 }}
      >
        <PlayGroundRunHistory />
      </Box>
    </Container>
  );
}

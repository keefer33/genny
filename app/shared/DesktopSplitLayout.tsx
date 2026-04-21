import { Box, Container } from "@mantine/core";
import type { ReactNode } from "react";

export default function DesktopSplitLayout({ children }: { children: ReactNode }) {
  return (
    <Box
      h="calc(100dvh - var(--app-shell-header-height, 0px) - var(--app-shell-footer-height, 0px))"
      style={{ minHeight: 0, overflow: "hidden" }}
    >
      <Container fluid h="100%" style={{ minHeight: 0, display: "flex", flexDirection: "column" }}>
        <Box
          pb="xs"
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "row",
            gap: "var(--mantine-spacing-md)",
          }}
        >
          {children}
        </Box>
      </Container>
    </Box>
  );
}

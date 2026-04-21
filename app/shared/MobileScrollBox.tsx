import { Box, Stack } from "@mantine/core";
import type { ReactNode } from "react";

export default function MobileScrollBox({ children }: { children: ReactNode }) {
  return (
    <Box
      h="calc(100dvh - var(--app-shell-header-height, 0px) - var(--app-shell-footer-height, 0px))"
      style={{ minHeight: 0, overflow: "hidden" }}
    >
      <Box
        px="0"
        h="100%"
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Stack gap="xs" px="xs" pt="xs" style={{ flex: 1, minHeight: 0 }}>
          {children}
        </Stack>
      </Box>
    </Box>
  );
}

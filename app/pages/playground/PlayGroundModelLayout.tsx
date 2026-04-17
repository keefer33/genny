import { Box, Container, Paper, Stack } from "@mantine/core";
import { Outlet } from "react-router";
import useAppStore from "~/lib/stores/appStore";
import PlayGroundRunHistory from "./PlayGroundRunHistory";

const DESKTOP_FORM_WIDTH = 420;

export default function PlayGroundModelLayout() {
  const { isMobile } = useAppStore();
  return (
    <Box
      h="calc(100dvh - var(--app-shell-header-height, 0px) - var(--app-shell-footer-height, 0px))"
      style={{ minHeight: 0, overflow: "hidden" }}
    >
      {isMobile ? (
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
          <Stack gap="sm" px="xs" pt="xs" style={{ flex: 1, minHeight: 0 }}>
            <Box style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
              <Outlet />
            </Box>
          </Stack>
        </Box>
      ) : (
        <Container
          //pl={!isMobile && 0}
          fluid
          h="100%"
          style={{ minHeight: 0, display: "flex", flexDirection: "column" }}
        >
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
            <Paper
              w={DESKTOP_FORM_WIDTH}
              p="xs"
              style={{
                flex: "0 0 auto",
                alignSelf: "stretch",
                minHeight: 0,
                maxHeight: "100%",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <Stack
                gap="sm"
                style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
              >
                <Box style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
                  <Outlet />
                </Box>
              </Stack>
            </Paper>
            <Box style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
              <PlayGroundRunHistory />
            </Box>
          </Box>
        </Container>
      )}
    </Box>
  );
}

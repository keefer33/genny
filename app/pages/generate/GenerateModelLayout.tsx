import { Box, Card, Container } from "@mantine/core";
import { Outlet } from "react-router";
import useAppStore from "~/lib/stores/appStore";
import { GenerationResults } from "~/pages/generate/components/GenerationResults";

const DESKTOP_FORM_WIDTH = 420;

export default function GenerateModelLayout() {
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
          <Outlet />
        </Box>
      ) : (
        <Container
          //pl={!isMobile && 0}
          fluid
          h="100%"
          style={{ minHeight: 0, display: "flex", flexDirection: "column" }}
        >
          <Box
            style={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "row",
              gap: "var(--mantine-spacing-md)",
            }}
          >
            <Card
              w={DESKTOP_FORM_WIDTH}
              style={{
                flex: "0 0 auto",
                height: "99%",
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Outlet />
            </Card>
            <Box style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
              <GenerationResults />
            </Box>
          </Box>
        </Container>
      )}
    </Box>
  );
}

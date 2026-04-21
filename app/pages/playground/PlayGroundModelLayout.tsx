import { Box, Paper, Stack } from "@mantine/core";
import { Outlet } from "react-router";
import useAppStore from "~/lib/stores/appStore";
import DesktopSplitLayout from "~/shared/DesktopSplitLayout";
import MobileScrollBox from "~/shared/MobileScrollBox";
import PlayGroundRunHistory from "./PlayGroundRunHistory";

const DESKTOP_FORM_WIDTH = 420;

export default function PlayGroundModelLayout() {
  const { isMobile } = useAppStore();
  return isMobile ? (
    <MobileScrollBox>
      <Outlet />
    </MobileScrollBox>
  ) : (
    <DesktopSplitLayout>
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
        <Stack gap="sm" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <Box style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
            <Outlet />
          </Box>
        </Stack>
      </Paper>
      <Box style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <PlayGroundRunHistory />
      </Box>
    </DesktopSplitLayout>
  );
}

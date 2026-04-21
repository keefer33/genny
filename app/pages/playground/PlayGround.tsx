import { Box, Paper, Stack } from "@mantine/core";
import useAppStore from "~/lib/stores/appStore";
import DesktopSplitLayout from "~/shared/DesktopSplitLayout";
import MobileScrollBox from "~/shared/MobileScrollBox";
import PlayGroundSearch from "./components/PlayGroundSearch";
import { PlayGroundModelBrowser } from "./components/PlayGroundModelBrowser";
import PlayGroundSearchFilters from "./components/PlayGroundSearchFilters";

const DESKTOP_FORM_WIDTH = 420;

export default function PlayGround() {
  const { isMobile } = useAppStore();
  return isMobile ? (
    <MobileScrollBox>
      <PlayGroundSearch />
      <PlayGroundSearchFilters />
      <PlayGroundModelBrowser
        linkMode="segments"
        showSearchLabel
        fetchOnMount={true}
        singleColumnGrid={true}
      />
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
            <PlayGroundSearch />
            <PlayGroundSearchFilters />
          </Box>
        </Stack>
      </Paper>
      <Box style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <PlayGroundModelBrowser
          linkMode="segments"
          showSearchLabel
          fetchOnMount={false}
          singleColumnGrid={true}
        />
      </Box>
    </DesktopSplitLayout>
  );
}

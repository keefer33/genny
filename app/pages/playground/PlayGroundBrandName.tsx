import { Box, Group, Stack } from "@mantine/core";
import { useEffect } from "react";
import { useParams } from "react-router";
import MobileScrollBox from "~/shared/MobileScrollBox";
import DesktopSplitLayout from "~/shared/DesktopSplitLayout";
import { Paper } from "@mantine/core";
import useAppStore from "~/lib/stores/appStore";
import PlayGroundBrandModelsPanel from "./components/PlayGroundBrandModelsPanel";
import PlayGroundRunHistory from "./PlayGroundRunHistory";
import usePlaygroundStore from "~/lib/stores/playgroundStore";
import { PlayGroundBreadcrumbs } from "./components/PlayGroundBreadcrumbs";
import PlayGroundRunHistoryModalAction from "./components/PlayGroundRunHistoryModalAction";

const DESKTOP_FORM_WIDTH = 420;

export default function PlayGroundBrandName() {
  const { brand_slug = "" } = useParams();
  const { isMobile } = useAppStore();
  const {
    setRunHistoryGenModelFilter,
    setRunHistoryBrandFilters,
    setRunHistoryModelProductFilters,
    setRunHistoryFileTypeFilter,
    setRunHistoryTagIds,
  } = usePlaygroundStore();
  const decodedBrand = decodeURIComponent(brand_slug).trim();

  useEffect(() => {
    setRunHistoryGenModelFilter(null);
    setRunHistoryBrandFilters(decodedBrand ? [decodedBrand] : []);
    setRunHistoryModelProductFilters([]);
    setRunHistoryFileTypeFilter("all");
    setRunHistoryTagIds([]);
  }, [
    decodedBrand,
    setRunHistoryGenModelFilter,
    setRunHistoryBrandFilters,
    setRunHistoryModelProductFilters,
    setRunHistoryFileTypeFilter,
    setRunHistoryTagIds,
  ]);

  return isMobile ? (
    <MobileScrollBox>
      <Group justify="space-between" align="center">
        <PlayGroundBreadcrumbs brandSegment={decodedBrand} depth="brand" />
        <PlayGroundRunHistoryModalAction title={decodedBrand || "Run history"} />
      </Group>
      <Box style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <PlayGroundBrandModelsPanel brandSegmentParam={brand_slug} />
      </Box>
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
            <PlayGroundBrandModelsPanel brandSegmentParam={brand_slug} />
          </Box>
        </Stack>
      </Paper>

      <Box style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <PlayGroundRunHistory showFiltersModal={false} showBulkActions={false} />
      </Box>
    </DesktopSplitLayout>
  );
}

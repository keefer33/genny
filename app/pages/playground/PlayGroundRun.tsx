import { Box, Group, Stack } from "@mantine/core";
import { useEffect } from "react";
import { useParams } from "react-router";
import MobileScrollBox from "~/shared/MobileScrollBox";
import DesktopSplitLayout from "~/shared/DesktopSplitLayout";
import useAppStore from "~/lib/stores/appStore";
import { Paper } from "@mantine/core";
import PlayGroundRunPanel from "./components/PlayGroundRunPanel";
import PlayGroundRunHistory from "./PlayGroundRunHistory";
import usePlaygroundStore from "~/lib/stores/playgroundStore";
import { PlayGroundBreadcrumbs } from "./components/PlayGroundBreadcrumbs";
import PlayGroundRunVariantSwitcher from "./components/PlayGroundRunVariantSwitcher";
import PlayGroundRunHistoryModalAction from "./components/PlayGroundRunHistoryModalAction";

export default function PlayGroundRun() {
  const { brand_slug = "", model_product = "", model_variant = "" } = useParams();
  const { isMobile } = useAppStore();
  const {
    setRunHistoryGenModelFilter,
    setRunHistoryBrandFilters,
    setRunHistoryModelProductFilters,
    setRunHistoryFileTypeFilter,
    setRunHistoryTagIds,
  } = usePlaygroundStore();
  const decodedBrand = decodeURIComponent(brand_slug).trim();
  const decodedProduct = decodeURIComponent(model_product).trim();
  const decodedVariant = decodeURIComponent(model_variant).trim();
  const runHistoryModalTitle = [decodedBrand, decodedProduct, decodedVariant]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    setRunHistoryGenModelFilter(null);
    setRunHistoryBrandFilters(decodedBrand ? [decodedBrand] : []);
    setRunHistoryModelProductFilters(decodedProduct ? [decodedProduct] : []);
    setRunHistoryFileTypeFilter("all");
    setRunHistoryTagIds([]);
  }, [
    decodedBrand,
    decodedProduct,
    setRunHistoryGenModelFilter,
    setRunHistoryBrandFilters,
    setRunHistoryModelProductFilters,
    setRunHistoryFileTypeFilter,
    setRunHistoryTagIds,
  ]);

  return isMobile ? (
    <MobileScrollBox>
      <Group justify="space-between" align="center">
        <PlayGroundBreadcrumbs
          brandSegment={decodedBrand}
          productSegment={decodedProduct}
          variantLabel={model_variant}
          depth="run"
        />
        <PlayGroundRunHistoryModalAction title={runHistoryModalTitle || "Run history"} />
      </Group>
      <PlayGroundRunVariantSwitcher />
      <Box style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <PlayGroundRunPanel
          brandSegmentParam={brand_slug}
          productSegmentParam={model_product}
          variantSegmentParam={model_variant}
        />
      </Box>
    </MobileScrollBox>
  ) : (
    <DesktopSplitLayout>
      <Paper
        w={420}
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
            <PlayGroundRunPanel
              brandSegmentParam={brand_slug}
              productSegmentParam={model_product}
              variantSegmentParam={model_variant}
            />
          </Box>
        </Stack>
      </Paper>
      <Box style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <PlayGroundRunHistory showFiltersModal={false} showBulkActions={false} />
      </Box>
    </DesktopSplitLayout>
  );
}

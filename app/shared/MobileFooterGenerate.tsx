import { Box, Group, SegmentedControl } from "@mantine/core";
import { RiHistoryLine, RiImageLine } from "@remixicon/react";
import useAppStore from "~/lib/stores/appStore";
import useGenerateStore from "~/lib/stores/generateStore";

export const MobileFooterGenerate = () => {
  const { themeColor } = useAppStore();
  const { activeTab, setActiveTab } = useGenerateStore();
  return (
    <Box p="sm">
      <SegmentedControl
        size="md"
        color={themeColor}
        value={activeTab}
        onChange={(value) => setActiveTab(value)}
        data={[
          {
            value: "form",
            label: (
              <Group gap="xs">
                <RiImageLine size={16} />
                <span>Generate</span>
              </Group>
            ),
          },
          {
            value: "results",
            label: (
              <Group gap="md">
                <RiHistoryLine size={16} />
                <span>Generations</span>
              </Group>
            ),
          },
        ]}
        fullWidth
      />
    </Box>
  );
};

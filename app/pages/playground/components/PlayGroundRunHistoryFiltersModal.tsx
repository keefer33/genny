import { Badge, Button, Group, Modal, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { RiFilter3Line } from "@remixicon/react";
import { RunHistoryFilters } from "~/pages/playground/components/run-history/RunHistoryFilters";
import { FileFilters } from "~/pages/files/components/FileFilters";
import useAppStore from "~/lib/stores/appStore";
import usePlaygroundStore from "~/lib/stores/playgroundStore";

export function PlayGroundRunHistoryFiltersModal({
  availableModels,
}: {
  availableModels: Array<{ id: string; name: string }>;
}) {
  const [opened, { open, close }] = useDisclosure(false);
  const { isMobile } = useAppStore();
  const {
    runHistoryGenModelFilter,
    runHistoryFileTypeFilter,
    runHistoryTagIds,
    setRunHistoryGenModelFilter,
    setRunHistoryFileTypeFilter,
    setRunHistoryTagIds,
  } = usePlaygroundStore();

  const selectedFiltersCount =
    (runHistoryGenModelFilter ? 1 : 0) +
    (runHistoryFileTypeFilter !== "all" ? 1 : 0) +
    runHistoryTagIds.length;

  return (
    <>
      <Group align="center" gap="xs">
        <Button variant="light" size="sm" leftSection={<RiFilter3Line size={16} />} onClick={open}>
          <Group gap={6} align="center">
            Filters
            <Badge variant="filled" size="xs">
              {selectedFiltersCount}
            </Badge>
          </Group>
        </Button>
      </Group>

      <Modal
        opened={opened}
        onClose={close}
        title="Filters"
        fullScreen={isMobile}
        size={isMobile ? undefined : "lg"}
      >
        <Stack gap="xl">
          <RunHistoryFilters
            availableModels={availableModels}
            modelId={runHistoryGenModelFilter}
            onModelIdChange={setRunHistoryGenModelFilter}
          />
          <FileFilters
            showTagManager
            showFileTypeFilter
            controlled={{
              fileType: runHistoryFileTypeFilter,
              onFileTypeChange: setRunHistoryFileTypeFilter,
              selectedTags: runHistoryTagIds,
              onSelectedTagsChange: setRunHistoryTagIds,
            }}
          />
        </Stack>
      </Modal>
    </>
  );
}

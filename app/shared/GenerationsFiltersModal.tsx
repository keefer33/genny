import { Badge, Button, Group, Modal, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { RiFilter3Line } from "@remixicon/react";
import { GenerationFilters } from "~/pages/generate/components/GenerationFilters";
import { FileFilters } from "~/pages/files/components/FileFilters";
import useAppStore from "~/lib/stores/appStore";
import useFilesFoldersStore from "~/lib/stores/filesFoldersStore";
import useGenerateStore from "~/lib/stores/generateStore";

interface GenerationsFiltersModalProps {
  availableModels: Array<{ id: string; name: string }>;
  showTagManager?: boolean;
}

export function GenerationsFiltersModal({
  availableModels,
  showTagManager = false,
}: GenerationsFiltersModalProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const { isMobile } = useAppStore();
  const { selectedFilterModelId } = useGenerateStore();
  const { fileTypeFilter, selectedTags } = useFilesFoldersStore();

  const selectedFiltersCount =
    (selectedFilterModelId ? 1 : 0) + (fileTypeFilter !== "all" ? 1 : 0) + selectedTags.length;

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
          <GenerationFilters availableModels={availableModels} />
          <FileFilters showTagManager={showTagManager} showFileTypeFilter />
        </Stack>
      </Modal>
    </>
  );
}

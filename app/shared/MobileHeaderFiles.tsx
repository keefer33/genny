import { Modal } from "@mantine/core";
import { RiFilterLine } from "@remixicon/react";
import { Badge, Group } from "@mantine/core";
import FileUpload from "~/pages/files/components/FileUpload";
import { Button } from "@mantine/core";
import { Stack } from "@mantine/core";
import { FileFilters } from "~/pages/files/components/FileFilters";
import useFilesFoldersStore from "~/lib/stores/filesFoldersStore";
import { useDisclosure } from "@mantine/hooks";

export const MobileHeaderFiles = () => {
  const [filtersModalOpened, { open: openFiltersModal, close: closeFiltersModal }] =
    useDisclosure(false);
  const { selectedTags, selectedUploadType, handleFileUpdate } = useFilesFoldersStore();

  return (
    <Group justify="space-between" align="center" p="xs">
      <FileUpload onUploadComplete={handleFileUpdate} />

      <Button leftSection={<RiFilterLine size={16} />} variant="light" onClick={openFiltersModal}>
        Filters
        {(selectedTags.length > 0 || selectedUploadType) && (
          <Badge size="sm" ml="xs" variant="filled" color="blue">
            {selectedTags.length + (selectedUploadType ? 1 : 0)}
          </Badge>
        )}
      </Button>

      <Modal opened={filtersModalOpened} onClose={closeFiltersModal} title="Filters" size="lg">
        <Stack gap="xl">
          <FileFilters showTagManager />
        </Stack>
      </Modal>
    </Group>
  );
};

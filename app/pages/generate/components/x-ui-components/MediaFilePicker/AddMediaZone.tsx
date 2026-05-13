import { Button, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import type { FileTypeFilter } from "~/lib/stores/filesFoldersStore";
import { FilePickerModal } from "~/shared/FilePickerModal";

export function AddMediaZone({
  selectLabel,
  modalTitle,
  allowedTypes,
  onPickPath,
  onAddUrl,
}: {
  selectLabel: string;
  modalTitle: string;
  allowedTypes: FileTypeFilter;
  onPickPath: (path: string) => void;
  onAddUrl: (url: string) => void;
}) {
  const [modalOpen, { open: openModal, close: closeModal }] = useDisclosure(false);

  return (
    <Stack gap="xs" w="100%">
      <Button variant="light" fullWidth onClick={openModal}>
        {selectLabel}
      </Button>
      <FilePickerModal
        opened={modalOpen}
        onClose={closeModal}
        onSelect={(path) => onPickPath(path)}
        onPasteUrl={onAddUrl}
        title={modalTitle}
        allowedTypes={allowedTypes}
      />
    </Stack>
  );
}

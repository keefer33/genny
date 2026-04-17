import { Button, Group, Stack, TextInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
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
  allowedTypes: "images" | "videos" | "audio" | "all";
  onPickPath: (path: string) => void;
  onAddUrl: (url: string) => void;
}) {
  const [modalOpen, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [pendingUrl, setPendingUrl] = useState("");

  const flushUrl = () => {
    const t = pendingUrl.trim();
    if (!t) return;
    onAddUrl(t);
    setPendingUrl("");
  };

  return (
    <Stack gap="xs" w="100%">
      <Button variant="light" fullWidth onClick={openModal}>
        {selectLabel}
      </Button>
      <Group align="flex-end" gap="xs" wrap="nowrap">
        <TextInput
          style={{ flex: 1 }}
          size="sm"
          placeholder="Or paste a media URL, then Enter"
          aria-label="Media URL"
          value={pendingUrl}
          onChange={(e) => setPendingUrl(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              flushUrl();
            }
          }}
        />
        <Button size="xs" variant="light" type="button" onClick={flushUrl}>
          Add URL
        </Button>
      </Group>
      <FilePickerModal
        opened={modalOpen}
        onClose={closeModal}
        onSelect={(path) => onPickPath(path)}
        title={modalTitle}
        allowedTypes={allowedTypes}
      />
    </Stack>
  );
}

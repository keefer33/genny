import {
  Box,
  Button,
  Center,
  Group,
  Loader,
  Modal,
  Radio,
  ScrollArea,
  Stack,
  Text,
} from "@mantine/core";
import { useEffect, useState } from "react";
import {
  characterAudioFileLabel,
  characterAudioFileUrl,
  type CharacterAudioFile,
} from "~/pages/characters/characterFileUtils";

type SelectCharacterAudioModalProps = {
  opened: boolean;
  onClose: () => void;
  audioFiles: CharacterAudioFile[];
  loading?: boolean;
  submitting?: boolean;
  onConfirm: (file: CharacterAudioFile) => void;
};

export function SelectCharacterAudioModal({
  opened,
  onClose,
  audioFiles,
  loading = false,
  submitting = false,
  onConfirm,
}: SelectCharacterAudioModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!opened) {
      setSelectedId(null);
      return;
    }
    if (audioFiles.length === 0) {
      setSelectedId(null);
      return;
    }
    setSelectedId((prev) => {
      if (prev && audioFiles.some((f) => f.id === prev)) return prev;
      return audioFiles[0]?.id ?? null;
    });
  }, [opened, audioFiles]);

  const selected = audioFiles.find((f) => f.id === selectedId) ?? null;

  return (
    <Modal opened={opened} onClose={onClose} title="Choose audio for video" centered size="md">
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Pick a voice preview or speech clip to pair with this image.
        </Text>

        {loading ? (
          <Center py="lg">
            <Loader size="sm" />
          </Center>
        ) : audioFiles.length === 0 ? (
          <Text size="sm" c="dimmed">
            No audio files for this character yet. Add a voice or generate speech first.
          </Text>
        ) : (
          <ScrollArea.Autosize mah={360} type="auto">
            <Radio.Group value={selectedId ?? ""} onChange={setSelectedId}>
              <Stack gap="sm">
                {audioFiles.map((file) => {
                  const url = characterAudioFileUrl(file);
                  const label = characterAudioFileLabel(file);
                  return (
                    <Box
                      key={file.id}
                      p="sm"
                      style={{
                        borderRadius: "var(--mantine-radius-md)",
                        border: "1px solid var(--mantine-color-gray-3)",
                      }}
                    >
                      <Radio value={file.id} label={label} />
                      {url ? (
                        <Box mt="xs" pl={28} onClick={(e) => e.stopPropagation()}>
                          <audio controls src={url} style={{ width: "100%", maxHeight: 40 }} />
                        </Box>
                      ) : null}
                    </Box>
                  );
                })}
              </Stack>
            </Radio.Group>
          </ScrollArea.Autosize>
        )}

        <Group justify="flex-end" gap="xs">
          <Button variant="default" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            disabled={!selected || loading || submitting}
            loading={submitting}
            onClick={() => {
              if (selected) onConfirm(selected);
            }}
          >
            Generate video
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

import {
  Box,
  Button,
  CloseButton,
  Container,
  Group,
  Loader,
  Modal,
  Stack,
  Text,
  type ButtonProps,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { RiMicLine } from "@remixicon/react";
import { useEffect, useState, type MouseEvent } from "react";
import useVoicesStore, { type UserVoice } from "~/lib/stores/voicesStore";
import { voiceMetaLine } from "~/pages/voices/voiceUtils";
import { UserVoicesList } from "~/pages/voices/components/UserVoicesList";
import { VoiceCard } from "~/pages/voices/components/VoiceCard";

const modalStyles = {
  content: { display: "flex", flexDirection: "column" as const },
  body: {
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column" as const,
    overflow: "hidden",
  },
};

const bodyBoxStyle = {
  flex: 1,
  minHeight: 0,
  width: "100%",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column" as const,
};

export type VoicePickerProps = {
  value: string | null;
  onChange: (voiceId: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
  modalTitle?: string;
  triggerVariant?: ButtonProps["variant"];
  triggerSize?: ButtonProps["size"];
  clearable?: boolean;
  selecting?: boolean;
};

export default function VoicePicker({
  value,
  onChange,
  disabled = false,
  placeholder = "Select voice",
  modalTitle = "Choose voice",
  triggerVariant = "default",
  triggerSize = "sm",
  clearable = true,
  selecting = false,
}: VoicePickerProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const userVoices = useVoicesStore((s) => s.userVoices);
  const getVoiceById = useVoicesStore((s) => s.getVoiceById);
  const loadUserVoices = useVoicesStore((s) => s.loadUserVoices);
  const [resolvedVoice, setResolvedVoice] = useState<UserVoice | null>(null);
  const [voiceLoading, setVoiceLoading] = useState(false);

  const voiceId = value?.trim() ?? "";

  useEffect(() => {
    if (!opened) return;
    void loadUserVoices({ page: 1, search: "", paginate: true });
  }, [opened, loadUserVoices]);

  useEffect(() => {
    if (!voiceId) {
      setResolvedVoice(null);
      setVoiceLoading(false);
      return;
    }

    const fromList = userVoices.find((voice) => voice.id === voiceId);
    if (fromList) {
      setResolvedVoice(fromList);
      setVoiceLoading(false);
      return;
    }

    let cancelled = false;
    setVoiceLoading(true);
    void getVoiceById(voiceId).then((voice) => {
      if (cancelled) return;
      setResolvedVoice(voice?.id === voiceId ? voice : null);
      setVoiceLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [voiceId, userVoices, getVoiceById]);

  const handleSelect = (voice: UserVoice) => {
    onChange(voice.id);
    close();
  };

  const handleClear = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onChange(null);
  };

  const triggerLabel = resolvedVoice?.name?.trim() || placeholder;
  const triggerMeta = resolvedVoice ? voiceMetaLine(resolvedVoice) : null;

  return (
    <>
      <Button
        variant={triggerVariant}
        size={triggerSize}
        leftSection={<RiMicLine size={18} />}
        rightSection={
          clearable && voiceId ? (
            <CloseButton
              size="sm"
              aria-label="Remove voice"
              disabled={selecting}
              onMouseDown={(event) => event.preventDefault()}
              onClick={handleClear}
            />
          ) : null
        }
        onClick={open}
        disabled={disabled || selecting}
        loading={selecting}
        fullWidth
        styles={{ label: { width: "100%" } }}
        h={triggerSize === "xs" ? undefined : 50}
      >
        <Stack gap={0} align="flex-start" style={{ minWidth: 0, width: "100%" }}>
          <Text size="sm" fw={600} truncate>
            {triggerLabel}
          </Text>
          {triggerMeta ? (
            <Text size="xs" c="dimmed" truncate>
              {triggerMeta}
            </Text>
          ) : null}
        </Stack>
      </Button>

      <Modal
        opened={opened}
        onClose={close}
        title={modalTitle}
        fullScreen
        centered
        styles={modalStyles}
      >
        <Container size="lg" p="0" style={bodyBoxStyle}>
          <Stack
            gap="md"
            style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
          >
            {voiceId ? (
              <Box px="xs" pt="xs">
                {voiceLoading && !resolvedVoice ? (
                  <Group justify="center" py="md">
                    <Loader size="sm" />
                  </Group>
                ) : resolvedVoice ? (
                  <VoiceCard voice={resolvedVoice} isEditable={false} />
                ) : (
                  <Text size="sm" c="dimmed">
                    Assigned voice could not be loaded.
                  </Text>
                )}
              </Box>
            ) : null}
            <Box
              style={{
                flex: 1,
                minHeight: 0,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <UserVoicesList
                mode="pick"
                selectedVoiceId={voiceId || null}
                onSelectVoice={handleSelect}
                selectLoading={selecting}
                fillContainer
                autoLoad={false}
              />
            </Box>
          </Stack>
        </Container>
      </Modal>
    </>
  );
}

import { ActionIcon, Badge, Card, Group, Modal, Stack, Text, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { GennyAudioPlayer } from "~/shared/GennyAudioPlayer";
import { RiDeleteBinLine, RiFileCopyLine, RiInformationLine, RiPencilLine } from "@remixicon/react";
import type { UserVoice } from "~/lib/stores/voicesStore";
import {
  isEditableUserVoice,
  voiceMetadataDescription,
  voiceMetaLine,
  voicePreviewUrl,
} from "~/pages/voices/voiceUtils";

type VoiceCardProps = {
  voice: UserVoice;
  badge?: string;
  onEdit?: (voice: UserVoice) => void;
  onClone?: (voice: UserVoice) => void;
  onDelete?: (voice: UserVoice) => void;
  onOpen?: (voice: UserVoice) => void;
};

function VoiceDescriptionInfo({ title, description }: { title?: string; description: string }) {
  const [opened, { open, close }] = useDisclosure(false);
  const modalTitle = title?.trim() ? `${title.trim()} — description` : "Description";

  return (
    <>
      <Tooltip label="Description">
        <ActionIcon
          variant="subtle"
          aria-label="Voice description"
          onClick={(event) => {
            event.stopPropagation();
            open();
          }}
        >
          <RiInformationLine size={18} />
        </ActionIcon>
      </Tooltip>
      <Modal opened={opened} onClose={close} title={modalTitle} centered size="md">
        <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
          {description}
        </Text>
      </Modal>
    </>
  );
}

export function VoiceCard({ voice, badge, onEdit, onClone, onDelete, onOpen }: VoiceCardProps) {
  const previewUrl = voicePreviewUrl(voice);
  const description = voiceMetadataDescription(voice);
  const meta = voiceMetaLine(voice);
  const editable = isEditableUserVoice(voice) && (onEdit || onClone || onDelete);
  const clickable = editable && Boolean(onOpen);

  return (
    <Card
      shadow="sm"
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? () => onOpen?.(voice) : undefined}
      onKeyDown={
        clickable
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onOpen?.(voice);
              }
            }
          : undefined
      }
      style={clickable ? { cursor: "pointer" } : undefined}
    >
      <Stack gap="sm">
        <Group justify="space-between" wrap="nowrap" align="flex-start">
          <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
            <Group justify="space-between" wrap="nowrap">
              <Text fw={600} lineClamp={1}>
                {voice.name ?? "Untitled voice"}
              </Text>
              <Group gap={4} wrap="nowrap">
                {editable ? (
                  <>
                    {onEdit ? (
                      <Tooltip label="Edit">
                        <ActionIcon
                          variant="subtle"
                          aria-label="Edit voice"
                          onClick={(event) => {
                            event.stopPropagation();
                            onEdit(voice);
                          }}
                        >
                          <RiPencilLine size={18} />
                        </ActionIcon>
                      </Tooltip>
                    ) : null}
                    {onDelete ? (
                      <Tooltip label="Delete">
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          aria-label="Delete voice"
                          onClick={(event) => {
                            event.stopPropagation();
                            onDelete(voice);
                          }}
                        >
                          <RiDeleteBinLine size={18} />
                        </ActionIcon>
                      </Tooltip>
                    ) : null}
                    {onClone ? (
                      <Tooltip label="Clone">
                        <ActionIcon
                          variant="subtle"
                          aria-label="Clone voice"
                          onClick={(event) => {
                            event.stopPropagation();
                            onClone(voice);
                          }}
                        >
                          <RiFileCopyLine size={18} />
                        </ActionIcon>
                      </Tooltip>
                    ) : null}
                  </>
                ) : !editable && description ? (
                  <VoiceDescriptionInfo title={voice.name ?? undefined} description={description} />
                ) : null}
                {badge ? (
                  <Badge variant="light" size="sm">
                    {badge}
                  </Badge>
                ) : null}
              </Group>
            </Group>

            {meta ? (
              <Text size="xs" c="dimmed" lineClamp={1}>
                {meta}
              </Text>
            ) : null}
            {editable && description ? (
              <Text size="sm" c="dimmed" lineClamp={2}>
                {description}
              </Text>
            ) : null}
          </Stack>
        </Group>
        {previewUrl ? (
          <GennyAudioPlayer src={previewUrl} compact stopPropagation />
        ) : (
          <Text size="sm" c="dimmed">
            No preview available
          </Text>
        )}
      </Stack>
    </Card>
  );
}

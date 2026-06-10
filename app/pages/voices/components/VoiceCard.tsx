import { ActionIcon, Badge, Button, Card, Group, Stack, Text, Title, Tooltip } from "@mantine/core";
import { GennyAudioPlayer } from "~/shared/GennyAudioPlayer";
import { RiDeleteBinLine, RiPencilLine } from "@remixicon/react";
import type { UserVoice } from "~/lib/stores/voicesStore";
import useVoicesStore from "~/lib/stores/voicesStore";
import {
  isEditableUserVoice,
  voiceMetadataDescription,
  voiceMetaLine,
  voicePreviewUrl,
} from "~/pages/voices/voiceUtils";
import type { MouseEvent } from "react";
import { useNavigate } from "react-router";
import useAppStore from "~/lib/stores/appStore";

type VoiceCardProps = {
  voice: UserVoice;
  isEditable?: boolean;
  pickMode?: boolean;
  isSelected?: boolean;
  selectLoading?: boolean;
  onSelect?: (voice: UserVoice) => void;
};

export function VoiceCard({
  voice,
  isEditable,
  pickMode = false,
  isSelected = false,
  selectLoading = false,
  onSelect,
}: VoiceCardProps) {
  const previewUrl = voicePreviewUrl(voice);
  const description = voiceMetadataDescription(voice);
  const meta = voiceMetaLine(voice);
  const editable = !pickMode && (isEditable ?? isEditableUserVoice(voice));
  const badge = voice.source?.split("_").pop() || null;
  const { setSelectedVoice, openEditVoice, openDeleteVoice } = useVoicesStore();
  const themeColor = useAppStore((s) => s.themeSettings.themeColor);
  const navigate = useNavigate();

  const goToVoice = () => navigate(`/voices/${encodeURIComponent(voice.id)}`);

  const openVoiceAction = (action: () => void) => (event: MouseEvent) => {
    event.stopPropagation();
    setSelectedVoice(voice);
    action();
  };

  return (
    <Card
      shadow="sm"
      role={editable ? "button" : undefined}
      tabIndex={editable ? 0 : undefined}
      onClick={editable ? () => goToVoice() : undefined}
      onKeyDown={
        editable
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                goToVoice();
              }
            }
          : undefined
      }
      style={editable ? { cursor: "pointer" } : undefined}
    >
      <Card.Section withBorder inheritPadding p="xs">
        <Stack gap={4}>
          <Title order={5} lineClamp={1}>
            {voice.name ?? "Untitled voice"}
          </Title>
          {meta ? (
            <Text size="xs" c={themeColor} lineClamp={1}>
              {meta}
            </Text>
          ) : null}
          {editable && description ? (
            <Text size="xs" lineClamp={2}>
              {description}
            </Text>
          ) : null}
        </Stack>
      </Card.Section>
      <Card.Section withBorder inheritPadding p="md">
        {previewUrl ? (
          <GennyAudioPlayer src={previewUrl} compact stopPropagation />
        ) : (
          <Text size="sm" c="dimmed">
            No preview available
          </Text>
        )}
      </Card.Section>
      <Card.Section withBorder inheritPadding p="xs">
        {pickMode ? (
          <Group justify="flex-end">
            <Button
              size="xs"
              variant={isSelected ? "light" : "filled"}
              loading={selectLoading}
              onClick={(event) => {
                event.stopPropagation();
                onSelect?.(voice);
              }}
            >
              {isSelected ? "Selected" : "Select"}
            </Button>
          </Group>
        ) : editable ? (
          <Group gap="xs" wrap="nowrap" justify="space-between">
            {badge ? (
              <Badge variant="light" size="sm">
                {badge}
              </Badge>
            ) : null}
            <Group gap="xs" wrap="nowrap">
              <Tooltip label="Edit">
                <ActionIcon
                  variant="subtle"
                  aria-label="Edit voice"
                  onClick={openVoiceAction(openEditVoice)}
                >
                  <RiPencilLine size={18} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Delete">
                <ActionIcon
                  variant="subtle"
                  color="red"
                  aria-label="Delete voice"
                  onClick={openVoiceAction(openDeleteVoice)}
                >
                  <RiDeleteBinLine size={18} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>
        ) : null}
      </Card.Section>
    </Card>
  );
}

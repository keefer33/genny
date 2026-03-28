import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Image,
  Modal,
  SimpleGrid,
  Stack,
  Text,
} from "@mantine/core";
import { RiAddLine, RiCloseLine } from "@remixicon/react";
import type { ChatAttachment } from "~/pages/agents/components/attachmentsTypes";

interface AttachmentsModalProps {
  isMobile: boolean;
  opened: boolean;
  attachments: ChatAttachment[];
  onClose: () => void;
  onOpenPicker: () => void;
  onClearAll: () => void;
  onRemove: (url: string) => void;
}

export default function AttachmentsModal({
  isMobile,
  opened,
  attachments,
  onClose,
  onOpenPicker,
  onClearAll,
  onRemove,
}: AttachmentsModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`Attachments (${attachments.length})`}
      size="lg"
      centered={!isMobile}
      fullScreen={isMobile}
    >
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group justify="space-between" align="center" gap="xs">
            <Button
              size="xs"
              variant="light"
              leftSection={<RiAddLine size={14} />}
              onClick={onOpenPicker}
            >
              Add More
            </Button>
            <Anchor size="xs" component="button" type="button" onClick={onClearAll} c="dimmed">
              Clear all
            </Anchor>
          </Group>
        </Group>
        {attachments.length === 0 ? (
          <Text size="sm" c="dimmed">
            No attachments selected yet.
          </Text>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            {attachments.map((attachment) => {
              const typeLabel = attachment.type?.startsWith("image/")
                ? "image"
                : attachment.type?.startsWith("video/")
                  ? "video"
                  : "file";
              return (
                <Card key={attachment.url} withBorder p="sm" radius="md">
                  <Stack gap="xs">
                    <Badge size="xs" variant="light" w="fit-content">
                      {typeLabel}
                    </Badge>
                    {typeLabel === "image" ? (
                      <Image
                        src={attachment.thumbnail_url || attachment.url}
                        alt={attachment.name || "Attachment"}
                        h={120}
                        fit="cover"
                      />
                    ) : typeLabel === "video" ? (
                      <Box
                        component="video"
                        src={attachment.thumbnail_url || attachment.url}
                        h={120}
                        style={{ width: "100%", objectFit: "cover", borderRadius: 8 }}
                        controls
                      />
                    ) : (
                      <Card withBorder p="xs">
                        <Text size="xs">PDF/File preview not available</Text>
                      </Card>
                    )}
                    <Anchor
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="xs"
                      truncate
                    >
                      {attachment.name || attachment.url}
                    </Anchor>
                    <Group justify="flex-end">
                      <ActionIcon
                        type="button"
                        size="sm"
                        variant="subtle"
                        color="red"
                        aria-label={`Remove ${attachment.name || "attachment"}`}
                        onClick={() => onRemove(attachment.url)}
                      >
                        <RiCloseLine size={14} />
                      </ActionIcon>
                    </Group>
                  </Stack>
                </Card>
              );
            })}
          </SimpleGrid>
        )}
      </Stack>
    </Modal>
  );
}

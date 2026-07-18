import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Center,
  Group,
  Image,
  Loader,
  Modal,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { RiAlertLine, RiDeleteBinLine } from "@remixicon/react";
import { useEffect, useMemo, useState } from "react";
import useStoryboardsStore from "~/lib/stores/storyboardsStore";
import {
  getStoryboardRenderError,
  renderHasFailed,
  renderIsProcessing,
  shouldPollStoryboardRenders,
  storyboardRenderThumbnailUrl,
  type StoryboardRender,
  type StoryboardRenderFile,
} from "~/pages/storyboards/storyboardRenderUtils";
import FileDetailModal, { type FileDetailModalFileItem } from "~/shared/FileDetailModal";

function renderFileToDetailFile(file: StoryboardRenderFile): FileDetailModalFileItem {
  return {
    id: file.id,
    file_name: file.file_name?.trim() || "Storyboard video",
    file_path: file.file_path?.trim() || "",
    file_size: file.file_size ?? 0,
    file_type: file.file_type?.trim() || "video/mp4",
    created_at: file.created_at ?? "",
    thumbnail_url: file.thumbnail_url?.trim() || undefined,
    upload_type: file.upload_type ?? "storyboard",
    generated_info: file.generated_info,
  };
}

type StoryboardRendersPanelProps = {
  storyboardId: string;
};

export function StoryboardRendersPanel({ storyboardId }: StoryboardRendersPanelProps) {
  const renders = useStoryboardsStore((s) => s.storyboardRenders);
  const loading = useStoryboardsStore((s) => s.storyboardRendersLoading);
  const deletingRenderId = useStoryboardsStore((s) => s.deletingRenderId);
  const loadStoryboardRenders = useStoryboardsStore((s) => s.loadStoryboardRenders);
  const deleteStoryboardRender = useStoryboardsStore((s) => s.deleteStoryboardRender);

  const [detailFile, setDetailFile] = useState<FileDetailModalFileItem | null>(null);
  const [detailOpened, { open: openDetail, close: closeDetail }] = useDisclosure(false);
  const [deleteConfirm, setDeleteConfirm] = useState<StoryboardRender | null>(null);

  const hasActive = useMemo(() => shouldPollStoryboardRenders(renders), [renders]);

  useEffect(() => {
    const id = storyboardId.trim();
    if (!id || !hasActive) return;
    const interval = window.setInterval(() => {
      void loadStoryboardRenders(id, { silent: true });
    }, 4000);
    return () => window.clearInterval(interval);
  }, [storyboardId, hasActive, loadStoryboardRenders]);

  const openFileDetail = (file: StoryboardRenderFile) => {
    setDetailFile(renderFileToDetailFile(file));
    openDetail();
  };

  const handleConfirmDelete = async () => {
    const render = deleteConfirm;
    const renderId = render?.id?.trim();
    if (!renderId) return;
    const ok = await deleteStoryboardRender(storyboardId, renderId);
    if (ok) setDeleteConfirm(null);
  };

  return (
    <Stack gap="sm">
      {loading ? (
        <Group justify="flex-end">
          <Loader size="xs" />
        </Group>
      ) : null}

      {renders.length === 0 && !loading ? (
        <Text size="sm" c="dimmed">
          No renders yet. Use Render video to create one.
        </Text>
      ) : (
        <SimpleGrid cols={1} spacing="sm">
          {renders.map((render) => {
            const failed = renderHasFailed(render);
            const processing = renderIsProcessing(render);
            const file = render.file ?? null;
            const thumbUrl = storyboardRenderThumbnailUrl(file);
            const errorMessage = getStoryboardRenderError(render);
            const createdLabel = render.created_at
              ? new Date(render.created_at).toLocaleString()
              : "Render";

            return (
              <Card key={render.id} padding={0} radius="md" withBorder>
                <Card.Section>
                  <Box
                    h={140}
                    w="100%"
                    pos="relative"
                    style={{ cursor: file ? "pointer" : "default" }}
                    onClick={() => {
                      if (file) openFileDetail(file);
                    }}
                  >
                    {thumbUrl ? (
                      <Image src={thumbUrl} alt="" h={140} fit="cover" />
                    ) : (
                      <Center h={140} bg="dark.6">
                        {processing ? (
                          <Loader size="md" />
                        ) : failed ? (
                          <RiAlertLine size={28} />
                        ) : null}
                      </Center>
                    )}
                    {processing ? (
                      <Badge color="blue" variant="filled" pos="absolute" top={8} left={8}>
                        Processing
                      </Badge>
                    ) : failed ? (
                      <Badge color="red" variant="filled" pos="absolute" top={8} left={8}>
                        Error
                      </Badge>
                    ) : null}
                  </Box>
                </Card.Section>
                <Stack gap={4} p="xs">
                  <Group justify="space-between" wrap="nowrap" align="flex-start">
                    <Text fw={600} size="sm" lineClamp={1}>
                      {file?.file_name?.trim() || createdLabel}
                    </Text>
                    <Tooltip label="Delete">
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        aria-label="Delete render"
                        onClick={() => setDeleteConfirm(render)}
                      >
                        <RiDeleteBinLine size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                  {failed && errorMessage ? (
                    <Text size="xs" c="red" lineClamp={3}>
                      {errorMessage}
                    </Text>
                  ) : (
                    <Text size="xs" c="dimmed">
                      {createdLabel}
                    </Text>
                  )}
                </Stack>
              </Card>
            );
          })}
        </SimpleGrid>
      )}

      <FileDetailModal
        opened={detailOpened}
        onClose={closeDetail}
        file={detailFile}
        onFileDeleted={() => {
          closeDetail();
          void loadStoryboardRenders(storyboardId, { silent: true });
        }}
      />

      <Modal
        opened={Boolean(deleteConfirm)}
        onClose={() => {
          if (deletingRenderId) return;
          setDeleteConfirm(null);
        }}
        title="Delete render?"
        centered
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Remove this render
            {deleteConfirm?.file?.file_name?.trim()
              ? ` (“${deleteConfirm.file.file_name.trim()}”)`
              : ""}
            ? This cannot be undone.
          </Text>
          <Group justify="flex-end">
            <Button
              variant="default"
              disabled={Boolean(deletingRenderId)}
              onClick={() => setDeleteConfirm(null)}
            >
              Cancel
            </Button>
            <Button
              color="red"
              loading={Boolean(deletingRenderId)}
              onClick={() => void handleConfirmDelete()}
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}

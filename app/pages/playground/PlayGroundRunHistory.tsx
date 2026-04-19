import {
  Box,
  Button,
  Card,
  Center,
  Checkbox,
  Group,
  Modal,
  ScrollArea,
  SimpleGrid,
  Stack,
  Text,
  Loader,
  ThemeIcon,
  Avatar,
} from "@mantine/core";
import { Carousel } from "@mantine/carousel";
import { useDisclosure } from "@mantine/hooks";
import { RiDeleteBinLine, RiEyeLine, RiImageLine } from "@remixicon/react";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { usePlaygroundRunsRealtime } from "~/lib/hooks/useUserRealtimeChannels";
import useAppStore from "~/lib/stores/appStore";
import { assertAuthFetchOk, authFetch, authFetchJson } from "~/lib/stores/authFetch";
import useFilesFoldersStore from "~/lib/stores/filesFoldersStore";
import usePlaygroundStore from "~/lib/stores/playgroundStore";
import useTagStore from "~/lib/stores/tagStore";
import {
  brandLogoFromGenModel,
  brandTextFromGenModel,
  formatPlaygroundGenModelDisplayName,
  genModelCatalogIdFromRunRow,
  genModelDisplayEmbedFromRunRow,
  isPlaygroundRunHistoryInFlight,
  runHistoryModelLabel,
  runHistoryPreviewBadgeLabel,
} from "~/lib/playgroundRunHistoryUtils";
import { endpoint } from "~/lib/utils";
import { showNotification } from "~/lib/notificationUtils";
import FileDetailModal, { type FileDetailModalFile } from "~/shared/FileDetailModal";
import { PlayGroundRunHistoryFiltersModal } from "~/pages/playground/components/PlayGroundRunHistoryFiltersModal";
import { AppPagination } from "~/shared/AppPagination";
import { CostBadge } from "~/shared/CostBadge";
import { HistoryPreviewWithBadge } from "./components/run-history/HistoryPreviewWithBadge";
import { HistoryRunDurationLabel } from "./components/run-history/HistoryRunDurationLabel";
import { HistoryRunLoadingThumb } from "./components/run-history/HistoryRunLoadingThumb";
import { RUN_HISTORY_THUMB_H } from "./components/run-history/runHistoryConstants";

export default function PlayGroundRunHistory() {
  const { isMobile, getUser, themeSettings } = useAppStore();
  const { colorScheme } = themeSettings;
  const user = getUser();
  const userId = user?.user?.id;
  const { loadTags } = useTagStore();
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [selectedFileMeta, setSelectedFileMeta] = useState<Map<string, { file_name: string }>>(
    new Map()
  );
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] =
    useDisclosure(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [fileDetailOpened, { open: openFileDetailModal, close: closeFileDetailModal }] =
    useDisclosure(false);
  const [fileDetail, setFileDetail] = useState<FileDetailModalFile | null>(null);
  const [fileDetailModelName, setFileDetailModelName] = useState<string | null>(null);
  const [fileDetailDeleting, setFileDetailDeleting] = useState(false);
  const [runDeleteId, setRunDeleteId] = useState<string | null>(null);
  const [runDeleteModalOpened, { open: openRunDeleteModal, close: closeRunDeleteModal }] =
    useDisclosure(false);
  const [runDeleteLoading, setRunDeleteLoading] = useState(false);

  const { deleteFile } = useFilesFoldersStore();

  const {
    runHistory,
    runHistoryTotal,
    runHistoryPage,
    runHistoryLimit,
    runHistoryLoading,
    runHistoryError,
    runHistoryGenModelFilter,
    runHistoryFileTypeFilter,
    runHistoryTagIds,
    runHistoryFilterModels,
    fetchPlaygroundRunHistory,
    fetchPlaygroundRunHistoryFilterModels,
    deletePlaygroundRun,
  } = usePlaygroundStore();

  /** Full list from API, plus any model on the current page not yet in that list (e.g. new run). */
  const availableModels = useMemo(() => {
    const byId = new Map<string, string>();
    for (const m of runHistoryFilterModels) {
      byId.set(m.id, m.name);
    }
    for (const row of runHistory) {
      const gid = genModelCatalogIdFromRunRow(row);
      if (!gid || byId.has(gid)) continue;
      const gm = genModelDisplayEmbedFromRunRow(row);
      if (gm) {
        byId.set(gid, formatPlaygroundGenModelDisplayName(gm));
      }
    }
    return [...byId.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [runHistoryFilterModels, runHistory]);

  const runHistoryTotalPages = Math.max(
    1,
    Math.ceil(runHistoryTotal / Math.max(1, runHistoryLimit))
  );

  const tagIdsKey = runHistoryTagIds.join(",");
  usePlaygroundRunsRealtime(userId);

  useEffect(() => {
    if (userId) {
      void loadTags(userId);
      void fetchPlaygroundRunHistoryFilterModels();
    }
  }, [userId, loadTags, fetchPlaygroundRunHistoryFilterModels]);

  useEffect(() => {
    void fetchPlaygroundRunHistory({ page: 1 });
  }, [runHistoryGenModelFilter, runHistoryFileTypeFilter, tagIdsKey, fetchPlaygroundRunHistory]);

  const selectableFilesOnPage = useMemo(() => {
    const out: Array<{ fileId: string; file_name: string }> = [];
    for (const row of runHistory) {
      if (isPlaygroundRunHistoryInFlight(row.status)) continue;
      for (const f of row.preview_files ?? []) {
        const id = f.id?.trim();
        if (!id) continue;
        const name = (f.file_name ?? "").trim() || "file";
        out.push({ fileId: id, file_name: name });
      }
    }
    return out;
  }, [runHistory]);

  const handleFileSelect = (fileId: string, selected: boolean, meta: { file_name: string }) => {
    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(fileId);
      else next.delete(fileId);
      return next;
    });
    setSelectedFileMeta((prev) => {
      const next = new Map(prev);
      if (selected) next.set(fileId, meta);
      else next.delete(fileId);
      return next;
    });
  };

  const selectedFilesOnPage = selectableFilesOnPage.filter((f) => selectedFileIds.has(f.fileId));
  const isAllSelected =
    selectableFilesOnPage.length > 0 && selectedFilesOnPage.length === selectableFilesOnPage.length;
  const isIndeterminate =
    selectedFilesOnPage.length > 0 && selectedFilesOnPage.length < selectableFilesOnPage.length;

  const handleSelectAll = (selected: boolean) => {
    const pageFileIds = new Set(selectableFilesOnPage.map((f) => f.fileId));
    if (selected) {
      setSelectedFileIds((prev) => {
        const merged = new Set(prev);
        pageFileIds.forEach((id) => merged.add(id));
        return merged;
      });
      setSelectedFileMeta((prev) => {
        const merged = new Map(prev);
        for (const f of selectableFilesOnPage) {
          merged.set(f.fileId, { file_name: f.file_name });
        }
        return merged;
      });
    } else {
      setSelectedFileIds((prev) => {
        const filtered = new Set(prev);
        pageFileIds.forEach((id) => filtered.delete(id));
        return filtered;
      });
      setSelectedFileMeta((prev) => {
        const filtered = new Map(prev);
        pageFileIds.forEach((id) => filtered.delete(id));
        return filtered;
      });
    }
  };

  const handleBulkDelete = async () => {
    if (!userId || selectedFileIds.size === 0) return;
    setBulkLoading(true);
    try {
      let deleted = 0;
      for (const fileId of selectedFileIds) {
        const meta =
          selectedFileMeta.get(fileId) ??
          (() => {
            for (const row of runHistory) {
              const f = row.preview_files?.find((p) => p.id === fileId);
              if (f) {
                return { file_name: (f.file_name ?? "").trim() || "file" };
              }
            }
            return null;
          })();
        if (!meta) continue;
        const res = await authFetch(`${endpoint}/user/files/${encodeURIComponent(fileId)}`, {
          method: "DELETE",
          body: JSON.stringify({ idOrName: meta.file_name }),
        });
        await assertAuthFetchOk(res, "Failed to delete file");
        deleted += 1;
      }
      if (deleted > 0) {
        showNotification({
          type: "success",
          title: "Deleted",
          message: `Removed ${deleted} file${deleted !== 1 ? "s" : ""}.`,
        });
        setSelectedFileIds(new Set());
        setSelectedFileMeta(new Map());
        closeDeleteModal();
        void fetchPlaygroundRunHistory({ page: runHistoryPage });
      }
    } catch (e) {
      showNotification({
        type: "error",
        message: e instanceof Error ? e.message : "Delete failed",
      });
    } finally {
      setBulkLoading(false);
    }
  };

  const openRunHistoryFileDetail = async (fileId: string, modelName: string | null) => {
    if (!userId) return;
    try {
      const data = await authFetchJson<{ file: FileDetailModalFile }>(
        `${endpoint}/user/files/${encodeURIComponent(fileId)}`,
        undefined,
        { errorMessage: "Failed to load file" }
      );
      setFileDetail(data.file);
      setFileDetailModelName(modelName);
      openFileDetailModal();
    } catch (e) {
      showNotification({
        type: "error",
        message: e instanceof Error ? e.message : "Failed to load file",
      });
    }
  };

  const handleFileDetailDownload = async () => {
    if (!fileDetail) return;
    try {
      const res = await fetch(fileDetail.file_path, { mode: "cors" });
      if (!res.ok) throw new Error("Fetch failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileDetail.file_name || "download";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(fileDetail.file_path, "_blank");
    }
  };

  const handleFileDetailDelete = async () => {
    if (!fileDetail || !userId) return;
    setFileDetailDeleting(true);
    try {
      const ok = await deleteFile(fileDetail.file_name, fileDetail.id, userId);
      if (ok) {
        const removedId = fileDetail.id;
        closeFileDetailModal();
        setFileDetail(null);
        setFileDetailModelName(null);
        setSelectedFileIds((prev) => {
          const next = new Set(prev);
          next.delete(removedId);
          return next;
        });
        setSelectedFileMeta((prev) => {
          const next = new Map(prev);
          next.delete(removedId);
          return next;
        });
        void fetchPlaygroundRunHistory({ page: runHistoryPage });
      }
    } finally {
      setFileDetailDeleting(false);
    }
  };

  const handleFileDetailTagsUpdated = (
    updatedTags: NonNullable<FileDetailModalFile["user_file_tags"]>
  ) => {
    setFileDetail((prev) => (prev ? { ...prev, user_file_tags: updatedTags } : null));
  };

  const openDeleteRunModal = (id: string) => {
    setRunDeleteId(id);
    openRunDeleteModal();
  };

  const handleConfirmDeleteRun = async () => {
    if (!runDeleteId) return;
    const runRow = runHistory.find((r) => r.id === runDeleteId);
    const fileIdsFromRun = new Set(
      (runRow?.preview_files ?? [])
        .map((p) => p.id?.trim())
        .filter((id): id is string => Boolean(id))
    );
    setRunDeleteLoading(true);
    try {
      await deletePlaygroundRun(runDeleteId);
      setSelectedFileIds((prev) => {
        const next = new Set(prev);
        fileIdsFromRun.forEach((fid) => next.delete(fid));
        return next;
      });
      setSelectedFileMeta((prev) => {
        const next = new Map(prev);
        fileIdsFromRun.forEach((fid) => next.delete(fid));
        return next;
      });
      if (fileDetail && fileIdsFromRun.has(fileDetail.id)) {
        closeFileDetailModal();
        setFileDetail(null);
        setFileDetailModelName(null);
      }
      showNotification({
        type: "success",
        title: "Run deleted",
        message: "The run and its files were removed.",
      });
      closeRunDeleteModal();
      setRunDeleteId(null);
    } catch (e) {
      showNotification({
        type: "error",
        message: e instanceof Error ? e.message : "Failed to delete run",
      });
    } finally {
      setRunDeleteLoading(false);
    }
  };

  if (runHistoryLoading && runHistory.length === 0) {
    return (
      <Box h="100%" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader size="sm" />
      </Box>
    );
  }

  if (runHistoryError) {
    return (
      <Stack gap="xs" p="md" h="100%" style={{ minHeight: 0 }}>
        <Group justify="space-between" align="center" wrap="wrap">
          <Text fw={700}>Run history</Text>
          <PlayGroundRunHistoryFiltersModal availableModels={availableModels} />
        </Group>
        <Text c="dimmed" size="sm">
          {runHistoryError}
        </Text>
      </Stack>
    );
  }

  return (
    <Stack gap="xs" h="100%" px="md" pt="sm" pb="xs" style={{ minHeight: 0 }}>
      <Group gap="sm">
        <PlayGroundRunHistoryFiltersModal availableModels={availableModels} />
        <Checkbox
          disabled={selectableFilesOnPage.length === 0}
          checked={isAllSelected}
          indeterminate={isIndeterminate}
          onChange={(event) => handleSelectAll(event.currentTarget.checked)}
          label={`${selectedFileIds.size} selected`}
        />
        {selectedFileIds.size > 0 ? (
          <Button
            variant="light"
            color="red"
            size="xs"
            onClick={openDeleteModal}
            loading={bulkLoading}
          >
            Delete
          </Button>
        ) : null}
      </Group>

      <Box style={{ flex: 1, minHeight: 0, minWidth: 0 }}>
        <ScrollArea h="100%" type="auto" offsetScrollbars pr={!isMobile ? "xs" : 0}>
          {runHistory.length === 0 ? (
            <Text c="dimmed" size="sm">
              No runs yet.
            </Text>
          ) : (
            <SimpleGrid cols={{ base: 1, "600px": 2, "900px": 3 }} spacing="xl" type="container">
              {runHistory.map((row) => {
                const gmRow = genModelDisplayEmbedFromRunRow(row);
                const inFlight = isPlaygroundRunHistoryInFlight(row.status);
                const showLoadingThumb = inFlight && row.preview_urls.length === 0;
                const singlePf = row.preview_files[0];
                const singleFid = singlePf?.id?.trim();
                const detailFid =
                  singleFid || row.preview_files.find((file) => file.id?.trim())?.id?.trim();
                const singleShowSelect = !inFlight && Boolean(singleFid);

                return (
                  <Card
                    key={row.id}
                    padding={0}
                    radius="md"
                    bg={colorScheme === "dark" ? "gray.9" : "gray.1"}
                  >
                    <Box
                      h={RUN_HISTORY_THUMB_H}
                      style={{
                        overflow: "hidden",
                        borderTopLeftRadius: "var(--mantine-radius-md)",
                        borderTopRightRadius: "var(--mantine-radius-md)",
                      }}
                    >
                      {showLoadingThumb ? (
                        <HistoryRunLoadingThumb status={row.status} created_at={row.created_at} />
                      ) : row.preview_urls.length > 1 ? (
                        <Carousel
                          height={RUN_HISTORY_THUMB_H}
                          withControls
                          withIndicators
                          slideSize="100%"
                          emblaOptions={{ loop: true }}
                          styles={{
                            controls: { top: "50%", transform: "translateY(-50%)" },
                            indicator: { width: 6, height: 6 },
                          }}
                        >
                          {row.preview_urls.map((url, i) => {
                            const pf = row.preview_files[i];
                            const fid = pf?.id?.trim();
                            const showSelect = !inFlight && Boolean(fid);
                            return (
                              <Carousel.Slide key={`${row.id}-${i}`}>
                                <HistoryPreviewWithBadge
                                  url={url}
                                  badgeLabel={runHistoryPreviewBadgeLabel(row, i)}
                                  fileId={fid}
                                  showSelect={showSelect}
                                  checked={fid ? selectedFileIds.has(fid) : false}
                                  onSelectChange={(next) => {
                                    if (!fid) return;
                                    handleFileSelect(fid, next, {
                                      file_name: (pf?.file_name ?? "").trim() || "file",
                                    });
                                  }}
                                  showViewButton={Boolean(fid) && !inFlight}
                                  onViewClick={
                                    fid
                                      ? () =>
                                          void openRunHistoryFileDetail(
                                            fid,
                                            runHistoryModelLabel(row)
                                          )
                                      : undefined
                                  }
                                />
                              </Carousel.Slide>
                            );
                          })}
                        </Carousel>
                      ) : row.preview_urls.length === 1 ? (
                        <HistoryPreviewWithBadge
                          url={row.thumbnail_url?.trim() || row.preview_urls[0]}
                          badgeLabel={runHistoryPreviewBadgeLabel(row, 0)}
                          fileId={singleFid}
                          showSelect={singleShowSelect}
                          checked={singleFid ? selectedFileIds.has(singleFid) : false}
                          onSelectChange={(next) => {
                            if (!singleFid) return;
                            handleFileSelect(singleFid, next, {
                              file_name: (singlePf?.file_name ?? "").trim() || "file",
                            });
                          }}
                          showViewButton={Boolean(singleFid) && !inFlight}
                          onViewClick={
                            singleFid
                              ? () =>
                                  void openRunHistoryFileDetail(
                                    singleFid,
                                    runHistoryModelLabel(row)
                                  )
                              : undefined
                          }
                        />
                      ) : (
                        <Center h={RUN_HISTORY_THUMB_H}>
                          <ThemeIcon variant="light" size="xl" radius="md" color="gray">
                            <RiImageLine size={28} />
                          </ThemeIcon>
                        </Center>
                      )}
                    </Box>
                    <Stack gap="xs" p="xs">
                      <Stack gap={0}>
                        <Group justify="space-between" align="center">
                          <Group gap="xs">
                            <Avatar
                              src={brandLogoFromGenModel(gmRow) ?? undefined}
                              size="sm"
                              radius="md"
                            />
                            <Text size="lg" fw={800}>
                              {brandTextFromGenModel(gmRow)}
                            </Text>
                          </Group>
                          {row.cost != null ? (
                            <CostBadge
                              cost={row.cost}
                              size="xs"
                              clickable={false}
                              variant="filled"
                            />
                          ) : null}
                        </Group>

                        <Text size="md" fw={600}>
                          {gmRow?.model_product ?? "—"}
                        </Text>
                        <Text size="sm" fw={600} c="dimmed">
                          {gmRow?.model_variant ?? "—"}
                        </Text>
                      </Stack>
                      <Group gap="xs" justify="space-between" align="center">
                        <Group gap="xs">
                          <Text size="xs" tt="capitalize">
                            {row.status ?? "—"}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {dayjs(row.created_at).format("MM/DD/YYYY h:mm A")}
                          </Text>
                        </Group>
                        <Text size="xs" c="dimmed" style={{ fontVariantNumeric: "tabular-nums" }}>
                          {showLoadingThumb ? (
                            "—"
                          ) : (
                            <HistoryRunDurationLabel
                              status={row.status}
                              created_at={row.created_at}
                              duration={row.duration}
                            />
                          )}
                        </Text>
                      </Group>
                      <Group gap="xs" justify="space-between">
                        <Button
                          variant="subtle"
                          color="red"
                          size="compact-xs"
                          leftSection={<RiDeleteBinLine size={14} />}
                          onClick={() => openDeleteRunModal(row.id)}
                        >
                          Delete run
                        </Button>

                        {detailFid && !inFlight ? (
                          <Group>
                            <Button
                              variant="subtle"
                              size="compact-xs"
                              leftSection={<RiEyeLine size={14} />}
                              onClick={() =>
                                void openRunHistoryFileDetail(detailFid, runHistoryModelLabel(row))
                              }
                            >
                              View details
                            </Button>
                          </Group>
                        ) : null}
                      </Group>
                    </Stack>
                  </Card>
                );
              })}
            </SimpleGrid>
          )}
        </ScrollArea>
      </Box>

      {runHistoryTotalPages > 1 && (
        <Group justify="center" py="xs">
          <AppPagination
            mobileVisibleItems={isMobile ? 4 : 7}
            siblings={2}
            boundaries={1}
            withEdges={false}
            total={runHistoryTotalPages}
            value={runHistoryPage}
            onChange={(page) => void fetchPlaygroundRunHistory({ page })}
            size="md"
          />
        </Group>
      )}

      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title="Delete selected files"
        centered
      >
        <Stack gap="md">
          <Text>
            Delete {selectedFileIds.size} file{selectedFileIds.size !== 1 ? "s" : ""}? This removes
            them from your library; it cannot be undone.
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button variant="light" onClick={closeDeleteModal} disabled={bulkLoading}>
              Cancel
            </Button>
            <Button color="red" onClick={() => void handleBulkDelete()} loading={bulkLoading}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>

      {fileDetail ? (
        <FileDetailModal
          opened={fileDetailOpened}
          onClose={() => {
            closeFileDetailModal();
            setFileDetail(null);
            setFileDetailModelName(null);
          }}
          file={fileDetail}
          modelName={fileDetailModelName ?? undefined}
          onDownload={() => void handleFileDetailDownload()}
          onEdit={() => {}}
          onDelete={() => void handleFileDetailDelete()}
          deleting={fileDetailDeleting}
          onTagsUpdated={handleFileDetailTagsUpdated}
        />
      ) : null}

      <Modal
        opened={runDeleteModalOpened}
        onClose={() => {
          closeRunDeleteModal();
          setRunDeleteId(null);
        }}
        title="Delete this run?"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            This removes the run from your history and deletes any output files stored in your
            library. This cannot be undone.
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button variant="light" onClick={closeRunDeleteModal} disabled={runDeleteLoading}>
              Cancel
            </Button>
            <Button
              color="red"
              onClick={() => void handleConfirmDeleteRun()}
              loading={runDeleteLoading}
            >
              Delete run
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}

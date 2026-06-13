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
  ActionIcon,
} from "@mantine/core";
import { Carousel } from "@mantine/carousel";
import { useDisclosure } from "@mantine/hooks";
import { RiDeleteBinLine, RiImageLine } from "@remixicon/react";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useGenerationsRunsRealtime } from "~/lib/hooks/useUserRealtimeChannels";
import useAppStore from "~/lib/stores/appStore";
import { isGenerationsHistoryInFlight } from "~/lib/generationsHistoryUtils";
import { showNotification } from "~/lib/notificationUtils";
import FileDetailModal from "~/shared/FileDetailModal";
import { PlayGroundRunHistoryFiltersModal } from "~/pages/generations/components/GenerationsHistoryFiltersModal";
import { AppPagination } from "~/shared/AppPagination";
import { CostBadge } from "~/shared/CostBadge";
import { historyFileEntityName } from "./historyFileEntityName";
import { HistoryPreviewWithBadge } from "./HistoryPreviewWithBadge";
import { HistoryRunDurationLabel } from "./HistoryDurationLabel";
import { HistoryRunLoadingThumb } from "./HistoryLoadingThumb";
import useGenerationsStore from "~/lib/stores/generateStore";
import type { GenerationsHistoryItem } from "~/types/generations";

type GenerationsHistoryDataSource = {
  items: GenerationsHistoryItem[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  error: string | null;
  onPageChange?: (page: number) => void;
  onRefresh?: () => void;
};

export default function GenerationsHistory({
  showFiltersModal = true,
  showBulkActions = true,
  showPagination = true,
  dataSource,
  onDeleteRun,
}: {
  showFiltersModal?: boolean;
  showBulkActions?: boolean;
  showPagination?: boolean;
  dataSource?: GenerationsHistoryDataSource;
  onDeleteRun?: (runId: string) => Promise<void>;
}) {
  const { isMobile, getUser, themeSettings } = useAppStore();
  const { colorScheme } = themeSettings;
  const user = getUser();
  const userId = user?.user?.id;
  const [selectedRunIds, setSelectedRunIds] = useState<Set<string>>(new Set());
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] =
    useDisclosure(false);
  const [fileDetailOpened, { open: openFileDetailModal, close: closeFileDetailModal }] =
    useDisclosure(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [runDeleteId, setRunDeleteId] = useState<string | null>(null);
  const [currentDetailFiles, setCurrentDetailFiles] = useState<any | null>(null);

  const {
    generationsHistory,
    generationsHistoryTotal,
    generationsHistoryPage,
    generationsHistoryLimit,
    generationsHistoryLoading,
    generationsHistoryError,
    generationsHistoryGenModelFilter,
    generationsHistoryBrandFilters,
    generationsHistoryModelProductFilters,
    generationsHistoryModelTypeFilters,
    generationsHistoryGenerationIdsFilter,
    fetchGenerationsHistory,
    deleteGenerate,
  } = useGenerationsStore();

  const isExternalDataSource = Boolean(dataSource);
  const historyItems = dataSource?.items ?? generationsHistory;
  const historyTotal = dataSource?.total ?? generationsHistoryTotal;
  const historyPage = dataSource?.page ?? generationsHistoryPage;
  const historyLimit = dataSource?.limit ?? generationsHistoryLimit;
  const historyLoading = dataSource?.loading ?? generationsHistoryLoading;
  const historyError = dataSource?.error ?? generationsHistoryError;
  const deleteRun = onDeleteRun ?? (!isExternalDataSource ? deleteGenerate : undefined);
  const canDeleteRuns = Boolean(deleteRun);

  const generationsHistoryTotalPages = Math.max(
    1,
    Math.ceil(historyTotal / Math.max(1, historyLimit))
  );

  const brandFiltersKey = generationsHistoryBrandFilters.join(",");
  const productFiltersKey = generationsHistoryModelProductFilters.join(",");
  const modelTypeFiltersKey = generationsHistoryModelTypeFilters.join(",");
  const generationIdsFilterKey = generationsHistoryGenerationIdsFilter.join(",");
  const isGenerationIdsScoped =
    !isExternalDataSource && generationsHistoryGenerationIdsFilter.length > 0;
  const shouldShowFiltersModal = showFiltersModal && !isGenerationIdsScoped;
  const shouldShowBulkActions = showBulkActions && !isGenerationIdsScoped && canDeleteRuns;
  const shouldShowPagination = showPagination && !isGenerationIdsScoped;
  useGenerationsRunsRealtime(userId);

  useEffect(() => {
    if (isExternalDataSource) return;
    void fetchGenerationsHistory({
      page: 1,
      limit: isGenerationIdsScoped ? generationsHistoryGenerationIdsFilter.length : undefined,
    });
  }, [
    isGenerationIdsScoped,
    generationIdsFilterKey,
    generationsHistoryGenModelFilter,
    brandFiltersKey,
    productFiltersKey,
    modelTypeFiltersKey,
    isExternalDataSource,
    fetchGenerationsHistory,
  ]);

  const selectableRunsOnPage = useMemo(
    () => historyItems.filter((row) => !isGenerationsHistoryInFlight(row.status)),
    [historyItems]
  );

  const handleRunSelect = (runId: string, selected: boolean) => {
    setSelectedRunIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(runId);
      else next.delete(runId);
      return next;
    });
  };

  const selectedRunsOnPage = selectableRunsOnPage.filter((row) => selectedRunIds.has(row.id));
  const isAllSelected =
    selectableRunsOnPage.length > 0 && selectedRunsOnPage.length === selectableRunsOnPage.length;
  const isIndeterminate =
    selectedRunsOnPage.length > 0 && selectedRunsOnPage.length < selectableRunsOnPage.length;

  const handleSelectAll = (selected: boolean) => {
    const pageRunIds = new Set(selectableRunsOnPage.map((row) => row.id));
    if (selected) {
      setSelectedRunIds((prev) => {
        const merged = new Set(prev);
        pageRunIds.forEach((id) => merged.add(id));
        return merged;
      });
    } else {
      setSelectedRunIds((prev) => {
        const filtered = new Set(prev);
        pageRunIds.forEach((id) => filtered.delete(id));
        return filtered;
      });
    }
  };

  const closeDeleteConfirmModal = () => {
    closeDeleteModal();
    setRunDeleteId(null);
  };

  const openBulkDeleteModal = () => {
    setRunDeleteId(null);
    openDeleteModal();
  };

  const openDeleteRunModal = (id: string) => {
    setRunDeleteId(id);
    openDeleteModal();
  };

  const openFileDetails = (files: unknown) => {
    setCurrentDetailFiles(files);
    openFileDetailModal();
  };

  const handleConfirmDelete = async () => {
    const runIds = runDeleteId ? [runDeleteId] : [...selectedRunIds];
    if (!deleteRun || runIds.length === 0) return;
    setBulkLoading(true);
    try {
      let deleted = 0;
      for (const id of runIds) {
        await deleteRun(id);
        deleted += 1;
      }
      if (deleted > 0) {
        showNotification({
          type: "success",
          title: "Deleted",
          message: `Removed ${deleted} run${deleted !== 1 ? "s" : ""}.`,
        });
        setSelectedRunIds((prev) => {
          if (!runDeleteId) return new Set();
          const next = new Set(prev);
          next.delete(runDeleteId);
          return next;
        });
        closeDeleteConfirmModal();
        if (isExternalDataSource) {
          dataSource?.onRefresh?.();
        } else {
          const newTotal = Math.max(0, generationsHistoryTotal - deleted);
          const maxPage = Math.max(1, Math.ceil(newTotal / generationsHistoryLimit));
          await fetchGenerationsHistory({ page: Math.min(generationsHistoryPage, maxPage) });
        }
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

  return (
    <Stack gap="xs" h="100%" style={{ minHeight: 0 }}>
      <Group gap="sm" justify="space-between" align="center" px="xs">
        {shouldShowFiltersModal ? <PlayGroundRunHistoryFiltersModal /> : null}
        {shouldShowBulkActions ? (
          <Group gap="0">
            <Checkbox
              disabled={selectableRunsOnPage.length === 0}
              checked={isAllSelected}
              indeterminate={isIndeterminate}
              onChange={(event) => handleSelectAll(event.currentTarget.checked)}
              label={`${selectedRunIds.size}`}
            />
            {selectedRunIds.size > 0 ? (
              <ActionIcon
                variant="transparent"
                color="red"
                size="md"
                onClick={openBulkDeleteModal}
                loading={bulkLoading}
              >
                <RiDeleteBinLine size={16} />
              </ActionIcon>
            ) : null}
          </Group>
        ) : null}
      </Group>

      <Box style={{ flex: 1, minHeight: 0, minWidth: 0 }}>
        <ScrollArea h="100%" type="auto" pb={isMobile ? undefined : "lg"}>
          {historyError ? (
            <Text c="dimmed" size="sm">
              {historyError}
            </Text>
          ) : historyLoading && historyItems.length === 0 ? (
            <Box
              h="100%"
              style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Loader size="sm" />
            </Box>
          ) : historyItems.length === 0 ? (
            <Text c="dimmed" size="sm">
              No runs yet.
            </Text>
          ) : (
            <SimpleGrid
              cols={{ base: 1, "600px": 2, "900px": 3 }}
              spacing="xl"
              type="container"
              px="sm"
            >
              {historyItems.map((row) => {
                const inFlight = isGenerationsHistoryInFlight(row.status);
                const showLoadingThumb = inFlight && row.user_files.length === 0;
                const hasCharacterFile = row.user_files.some(
                  (file) => (file.upload_type ?? "").trim().toLowerCase() === "character"
                );
                const singlePf = row.user_files[0];
                const singleFid = singlePf?.id?.trim();
                const detailFid =
                  singleFid || row.user_files.find((file) => file.id?.trim())?.id?.trim();
                const pollingError = (() => {
                  const raw = (row as { polling_response?: unknown }).polling_response;
                  if (!raw || typeof raw !== "object") return null;
                  const maybe = (raw as { error?: unknown }).error;
                  if (typeof maybe !== "string") return null;
                  const text = maybe.trim();
                  return text || null;
                })();
                return (
                  <Card
                    key={row.id}
                    padding={0}
                    radius="md"
                    bg={colorScheme === "dark" ? "gray.9" : "gray.1"}
                    pos="relative"
                  >
                    {shouldShowBulkActions && !inFlight ? (
                      <Checkbox
                        checked={selectedRunIds.has(row.id)}
                        onChange={(event) => handleRunSelect(row.id, event.currentTarget.checked)}
                        onClick={(event) => event.stopPropagation()}
                        style={{
                          position: "absolute",
                          top: 6,
                          right: 6,
                          zIndex: 12,
                        }}
                      />
                    ) : null}
                    <Box
                      w="100%"
                      style={{
                        aspectRatio: "1 / 1",
                        overflow: "hidden",
                        borderTopLeftRadius: "var(--mantine-radius-md)",
                        borderTopRightRadius: "var(--mantine-radius-md)",
                      }}
                    >
                      {showLoadingThumb ? (
                        <HistoryRunLoadingThumb status={row.status} created_at={row.created_at} />
                      ) : row.user_files.length === 0 ? (
                        <Center h="100%">
                          <ThemeIcon variant="light" size="xl" radius="md" color="gray">
                            <RiImageLine size={28} />
                          </ThemeIcon>
                        </Center>
                      ) : row.user_files.length > 1 ? (
                        <Carousel
                          height="100%"
                          withControls
                          withIndicators
                          slideSize="100%"
                          emblaOptions={{ loop: true }}
                          previousControlProps={{
                            onClick: (event) => event.stopPropagation(),
                            onPointerDown: (event) => event.stopPropagation(),
                          }}
                          nextControlProps={{
                            onClick: (event) => event.stopPropagation(),
                            onPointerDown: (event) => event.stopPropagation(),
                          }}
                          styles={{
                            root: { height: "100%" },
                            viewport: { height: "100%" },
                            container: { height: "100%" },
                            slide: { height: "100%" },
                            controls: { top: "50%", transform: "translateY(-50%)" },
                            indicator: { width: 6, height: 6 },
                          }}
                        >
                          {row.user_files.map((file, i) => (
                            <Carousel.Slide key={`${file.id}-${i}`}>
                              <Box
                                role="button"
                                tabIndex={0}
                                h="100%"
                                w="100%"
                                onClick={() => openFileDetails(row.user_files)}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    openFileDetails(row.user_files);
                                  }
                                }}
                                style={{ cursor: "pointer" }}
                              >
                                <HistoryPreviewWithBadge
                                  url={file.thumbnail_url ?? file.file_path ?? ""}
                                  file_type={file.file_type ?? ""}
                                  upload_type={file.upload_type}
                                  isBaseLook={false}
                                />
                              </Box>
                            </Carousel.Slide>
                          ))}
                        </Carousel>
                      ) : (
                        <Box
                          role="button"
                          tabIndex={0}
                          h="100%"
                          w="100%"
                          onClick={() => openFileDetails(row.user_files)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              openFileDetails(row.user_files);
                            }
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          <HistoryPreviewWithBadge
                            url={
                              row.user_files[0].thumbnail_url ?? row.user_files[0].file_path ?? ""
                            }
                            file_type={row.user_files[0].file_type ?? ""}
                            upload_type={row.user_files[0].upload_type}
                            entityName={historyFileEntityName(row.user_files[0])}
                            isBaseLook={false}
                          />
                        </Box>
                      )}
                    </Box>
                    <Stack gap="xs" p="xs">
                      <Stack gap={0}>
                        <Group justify="space-between" align="center">
                          <Group gap="xs">
                            <Avatar
                              src={
                                (row.gen_model_id as { brand_name?: { logo?: string } })?.brand_name
                                  ?.logo ?? undefined
                              }
                              size="sm"
                              radius="md"
                            />
                            <Text size="lg" fw={800}>
                              {(row.gen_model_id as { brand_name?: { name?: string } })?.brand_name
                                ?.name ?? "—"}
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
                          {row?.gen_model_id?.model_product ?? "—"}
                        </Text>
                        <Text size="sm" fw={600} c="dimmed">
                          {row?.gen_model_id?.model_variant ?? "—"}
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
                      {row.status === "error" ? (
                        <Text size="xs" c="red">
                          {pollingError || "Generation failed, please try again."}
                        </Text>
                      ) : null}

                      {!inFlight ? (
                        <Group gap="xs" justify="space-between">
                          <Button
                            variant="subtle"
                            color="red"
                            size="compact-xs"
                            disabled={hasCharacterFile}
                            leftSection={<RiDeleteBinLine size={14} />}
                            onClick={() => openDeleteRunModal(row.id)}
                          >
                            Delete run
                          </Button>
                          {detailFid ? (
                            <Button
                              variant="subtle"
                              size="compact-xs"
                              onClick={() => openFileDetails(row.user_files)}
                            >
                              View details
                            </Button>
                          ) : null}
                        </Group>
                      ) : null}
                    </Stack>
                  </Card>
                );
              })}
            </SimpleGrid>
          )}
        </ScrollArea>
      </Box>

      {shouldShowPagination && generationsHistoryTotalPages > 1 && (
        <Group justify="center" py="xs">
          <AppPagination
            mobileVisibleItems={isMobile ? 4 : 7}
            total={generationsHistoryTotalPages}
            value={historyPage}
            onChange={(page) => {
              if (isExternalDataSource) {
                dataSource?.onPageChange?.(page);
                return;
              }
              void fetchGenerationsHistory({ page });
            }}
            size="md"
          />
        </Group>
      )}

      <FileDetailModal
        opened={fileDetailOpened}
        onClose={closeFileDetailModal}
        file={currentDetailFiles}
        onFileUpdated={() => {
          if (isExternalDataSource) {
            dataSource?.onRefresh?.();
          } else {
            void fetchGenerationsHistory({ page: generationsHistoryPage });
          }
        }}
        onFileDeleted={() => {
          closeFileDetailModal();
          setCurrentDetailFiles(null);
          if (isExternalDataSource) {
            dataSource?.onRefresh?.();
          } else {
            void fetchGenerationsHistory({ page: generationsHistoryPage });
          }
        }}
      />

      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteConfirmModal}
        title={runDeleteId ? "Delete this run?" : "Delete selected runs?"}
        centered
      >
        <Stack gap="md">
          <Text>
            {runDeleteId
              ? "This removes the run from your history and deletes any output files stored in your library. This cannot be undone."
              : `Delete ${selectedRunIds.size} run${selectedRunIds.size !== 1 ? "s" : ""}? This removes the selected runs and their files from your library; it cannot be undone.`}
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button variant="light" onClick={closeDeleteConfirmModal} disabled={bulkLoading}>
              Cancel
            </Button>
            <Button color="red" onClick={() => void handleConfirmDelete()} loading={bulkLoading}>
              {runDeleteId ? "Delete run" : "Delete"}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}

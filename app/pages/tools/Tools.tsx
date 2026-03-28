import {
  Stack,
  Text,
  Card,
  Button,
  Group,
  SimpleGrid,
  Loader,
  Badge,
  Modal,
  Box,
  Anchor,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { RiToolsLine, RiDeleteBinLine, RiLinkM } from "@remixicon/react";
import { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import Mounted from "~/shared/Mounted";
import useAppStore from "~/lib/stores/appStore";
import {
  useToolsStore,
  type ToolkitItem,
  type ConnectedAccountItem,
} from "~/lib/stores/toolsStore";
import ToolsFilters, { type ConnectedFilterValue } from "~/pages/tools/ToolsFilters";

const TOOLKITS_PAGE_SIZE = 24;

/** Set to true when Composio categories API is working to show the category filter. */
const SHOW_TOOLKIT_CATEGORY_FILTER = false;

export default function Tools() {
  const { isMobile } = useAppStore();
  const {
    toolkitsData,
    toolkitsLoading,
    toolkitsError,
    categoriesData,
    searchQuery,
    searchInput,
    setSearchInput,
    submitSearch,
    clearSearch,
    categoryFilter,
    setCategoryFilter,
    sortBy,
    setSortBy,
    loadToolkits,
    loadCategories,
    loadConnectedAccounts,
    connectedAccounts,
    connectedAccountsLoading,
    connectedAccountsError,
    deleteConnectedAccount,
    getConnectionForToolkit,
    createConnectLink,
  } = useToolsStore();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [connectedFilter, setConnectedFilter] = useState<ConnectedFilterValue>("all");
  const [connectingSlug, setConnectingSlug] = useState<string | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<ConnectedAccountItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] =
    useDisclosure(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Show notification and clear URL when returning from toolkit provider auth (e.g. ?status=success&connected_account_id=...)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get("status");
    if (status == null) return;
    if (status === "success") {
      void loadConnectedAccounts();
      notifications.show({
        title: "Toolkit connected",
        message: "Your account has been connected. You can use this toolkit with your agents.",
        color: "green",
      });
    } else {
      notifications.show({
        title: "Connection incomplete",
        message:
          status === "error"
            ? "Something went wrong. Try connecting again."
            : "Connection was not completed.",
        color: "yellow",
      });
    }
    navigate(location.pathname, { replace: true });
  }, [location.search, location.pathname, navigate, loadConnectedAccounts]);

  const handleCloseDeleteModal = () => {
    if (!deletingId) {
      closeDeleteModal();
      setAccountToDelete(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!accountToDelete) return;
    setDeletingId(accountToDelete.id);
    try {
      await deleteConnectedAccount(accountToDelete.id);
      notifications.show({
        title: "Connection removed",
        message: `Toolkit "${accountToDelete.toolkit?.slug ?? "unknown"}" has been disconnected.`,
        color: "green",
      });
      closeDeleteModal();
      setAccountToDelete(null);
    } catch (err) {
      notifications.show({
        title: "Failed to remove connection",
        message: err instanceof Error ? err.message : "Unknown error",
        color: "red",
      });
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    loadToolkits({
      search: searchQuery || undefined,
      category: SHOW_TOOLKIT_CATEGORY_FILTER ? categoryFilter || undefined : undefined,
      sort_by: sortBy,
      limit: TOOLKITS_PAGE_SIZE,
    });
  }, [searchQuery, categoryFilter, sortBy, loadToolkits]);

  useEffect(() => {
    const t = setTimeout(() => submitSearch(), 300);
    return () => clearTimeout(t);
  }, [searchInput, submitSearch]);

  useEffect(() => {
    if (SHOW_TOOLKIT_CATEGORY_FILTER) loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadConnectedAccounts();
  }, [loadConnectedAccounts]);

  const items: ToolkitItem[] = toolkitsData?.items ?? [];
  const nextCursor = toolkitsData?.next_cursor;
  const totalItems = toolkitsData?.total_items ?? 0;
  const hasMore = !!nextCursor && items.length < totalItems;

  useEffect(() => {
    if (!hasMore || toolkitsLoading) return;
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadToolkits({
            search: searchQuery || undefined,
            category: SHOW_TOOLKIT_CATEGORY_FILTER ? categoryFilter || undefined : undefined,
            sort_by: sortBy,
            cursor: nextCursor,
            limit: TOOLKITS_PAGE_SIZE,
          });
        }
      },
      { rootMargin: "200px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, toolkitsLoading, nextCursor, searchQuery, categoryFilter, sortBy, loadToolkits]);

  const categories = categoriesData?.items ?? [];
  const categoryOptions = [
    { value: "", label: "All categories" },
    ...Array.from(new Map(categories.map((c) => [c.id, { value: c.id, label: c.name }])).values()),
  ];

  // List to show: from browse (items) or from connected accounts
  const filteredBrowseItems =
    connectedFilter === "not_connected"
      ? items.filter((tk) => !getConnectionForToolkit(tk.slug))
      : items;
  const showBrowseList = connectedFilter === "all" || connectedFilter === "not_connected";
  const displayBrowseCount = showBrowseList ? filteredBrowseItems.length : 0;
  const showConnectedList = connectedFilter === "connected";
  const displayConnectedCount = connectedAccounts.length;

  const handleConnect = async (toolkitSlug: string) => {
    setConnectingSlug(toolkitSlug);
    try {
      const result = await createConnectLink({
        toolkit_slug: toolkitSlug,
        callback_url: window.location.href,
      });
      if (result?.redirect_url) {
        window.open(result.redirect_url, "_self", "noopener,noreferrer");
        notifications.show({
          title: "Complete connection",
          message: "Finish signing in in the new tab. Then refresh this page.",
          color: "blue",
        });
        loadConnectedAccounts();
      }
    } catch (err) {
      notifications.show({
        title: "Failed to create connect link",
        message: err instanceof Error ? err.message : "Unknown error",
        color: "red",
      });
    } finally {
      setConnectingSlug(null);
    }
  };

  return (
    <Mounted>
      <Stack gap="xl">
        <Stack gap="xs">
          <Text size="xl" fw={700}>
            Tools & integrations
          </Text>
        </Stack>

        <Stack gap="md">
          <ToolsFilters
            isMobile={isMobile}
            searchInput={searchInput}
            onSearchChange={setSearchInput}
            onClearSearch={clearSearch}
            connectedFilter={connectedFilter}
            onConnectedFilterChange={setConnectedFilter}
            displayConnectedCount={displayConnectedCount}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            showCategoryFilter={SHOW_TOOLKIT_CATEGORY_FILTER}
            categoryFilter={categoryFilter || ""}
            onCategoryFilterChange={(v) => setCategoryFilter(v ?? "")}
            categoryOptions={categoryOptions}
          />

          {connectedAccountsError && (
            <Card padding="md" radius="xs" style={{ borderColor: "var(--mantine-color-red-3)" }}>
              <Text size="sm" c="red">
                {connectedAccountsError}
              </Text>
            </Card>
          )}

          {toolkitsError && showBrowseList && (
            <Card padding="md" radius="xs" style={{ borderColor: "var(--mantine-color-red-3)" }}>
              <Text size="sm" c="red">
                {toolkitsError}
              </Text>
            </Card>
          )}

          {showConnectedList && connectedAccountsLoading ? (
            <Card padding="sm" radius="xs">
              <Group gap="xs">
                <Loader size="sm" />
                <Text size="sm" c="dimmed">
                  Loading your connections…
                </Text>
              </Group>
            </Card>
          ) : showConnectedList && connectedAccounts.length === 0 ? (
            <Card padding="xl" radius="xs">
              <Stack gap="md" align="center">
                <RiToolsLine size={48} color="var(--mantine-color-gray-5)" />
                <Text c="dimmed">No connected toolkits.</Text>
                <Text size="sm" c="dimmed">
                  Use the search above to find integrations, then connect from a toolkit card.
                </Text>
              </Stack>
            </Card>
          ) : showBrowseList && toolkitsLoading && items.length === 0 ? (
            <Card padding="xl" radius="xs">
              <Group justify="center">
                <Loader />
              </Group>
            </Card>
          ) : showBrowseList && displayBrowseCount === 0 ? (
            <Card padding="xl" radius="xs">
              <Stack gap="md" align="center">
                <RiToolsLine size={48} color="var(--mantine-color-gray-5)" />
                <Text c="dimmed">
                  {connectedFilter === "not_connected"
                    ? "All toolkits on this page are connected."
                    : "No toolkits found."}
                </Text>
                {(searchQuery || categoryFilter) && (
                  <Button
                    variant="light"
                    onClick={() => {
                      clearSearch();
                      setCategoryFilter("");
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </Stack>
            </Card>
          ) : (
            <Stack gap="md">
              <Text size="sm" c="dimmed">
                {showConnectedList
                  ? `${displayConnectedCount} connected`
                  : `${displayBrowseCount}${totalItems > items.length ? ` of ${totalItems}` : ""} toolkits`}
              </Text>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                {showConnectedList
                  ? connectedAccounts.map((acc) => {
                      const slug = acc.toolkit?.slug ?? "unknown";
                      const isActive = acc.status === "ACTIVE";
                      const toolkitInfo = items.find((tk) => tk.slug === slug);
                      const displayName = toolkitInfo?.name ?? slug;
                      const description = toolkitInfo?.meta?.description;
                      const toolsCount = toolkitInfo?.meta?.tools_count ?? 0;
                      const noAuth = toolkitInfo?.no_auth;
                      return (
                        <Card key={acc.id} padding="md" radius="sm" shadow="sm">
                          <Stack gap="xs">
                            <Box
                              component={Link}
                              to={`/tools/${encodeURIComponent(slug)}`}
                              style={{ cursor: "pointer", textDecoration: "none" }}
                            >
                              <Group gap="xs" wrap="nowrap">
                                {toolkitInfo?.meta?.logo ? (
                                  <img
                                    src={toolkitInfo.meta.logo}
                                    alt=""
                                    width={24}
                                    height={24}
                                    style={{ borderRadius: 4 }}
                                  />
                                ) : (
                                  <RiToolsLine size={24} color="var(--mantine-color-blue-6)" />
                                )}
                                <Text
                                  c="var(--mantine-color-text)"
                                  size="sm"
                                  fw={600}
                                  lineClamp={1}
                                  style={{ flex: 1 }}
                                >
                                  {displayName}
                                </Text>
                              </Group>
                              {description && (
                                <Text size="xs" c="dimmed" lineClamp={2} mt={4}>
                                  {description}
                                </Text>
                              )}
                            </Box>
                            <Group gap="xs" justify="space-between" wrap="nowrap">
                              <Group gap={4}>
                                <Text size="xs" c="dimmed" component="span">
                                  {toolsCount} tools
                                </Text>
                                <Anchor
                                  component={Link}
                                  to={`/tools/${encodeURIComponent(slug)}`}
                                  size="xs"
                                >
                                  View details
                                </Anchor>
                              </Group>
                              {noAuth && (
                                <Badge size="xs" color="blue" variant="light">
                                  No auth required
                                </Badge>
                              )}
                              <Badge
                                size="xs"
                                color={isActive ? "green" : "yellow"}
                                variant="light"
                              >
                                {isActive ? "Active" : (acc.status ?? "Pending")}
                              </Badge>
                            </Group>
                            <Button
                              variant="light"
                              color="red"
                              size="xs"
                              leftSection={<RiDeleteBinLine size={14} />}
                              onClick={() => {
                                setAccountToDelete(acc);
                                openDeleteModal();
                              }}
                            >
                              Disconnect
                            </Button>
                          </Stack>
                        </Card>
                      );
                    })
                  : filteredBrowseItems.map((tk) => {
                      const connection = getConnectionForToolkit(tk.slug);
                      const isConnected = connection?.status === "ACTIVE";
                      const toolsCount = tk.meta?.tools_count ?? 0;
                      const noAuth = tk.no_auth;
                      return (
                        <Card key={tk.slug} padding="md" radius="sm" shadow="sm">
                          <Stack gap="xs">
                            <Box
                              component={Link}
                              to={`/tools/${encodeURIComponent(tk.slug)}`}
                              style={{ cursor: "pointer", textDecoration: "none" }}
                            >
                              <Group gap="xs" wrap="nowrap">
                                {tk.meta?.logo ? (
                                  <img
                                    src={tk.meta.logo}
                                    alt=""
                                    width={24}
                                    height={24}
                                    style={{ borderRadius: 4 }}
                                  />
                                ) : (
                                  <RiToolsLine size={24} color="var(--mantine-color-blue-6)" />
                                )}
                                <Text
                                  c="var(--mantine-color-text)"
                                  size="sm"
                                  fw={600}
                                  lineClamp={1}
                                  style={{ flex: 1 }}
                                >
                                  {tk.name}
                                </Text>
                              </Group>
                              <Text size="xs" c="dimmed" lineClamp={2} mt={4}>
                                {tk.meta?.description ?? "No description"}
                              </Text>
                            </Box>
                            <Group gap="xs" justify="space-between" wrap="nowrap">
                              <Group gap={4}>
                                <Text size="xs" c="dimmed" component="span">
                                  {toolsCount} tools
                                </Text>
                                <Anchor
                                  component={Link}
                                  to={`/tools/${encodeURIComponent(tk.slug)}`}
                                  size="xs"
                                >
                                  View details
                                </Anchor>
                              </Group>
                              {noAuth && (
                                <Badge size="xs" color="blue" variant="light">
                                  No auth required
                                </Badge>
                              )}
                              {connection && (
                                <Badge
                                  size="xs"
                                  color={isConnected ? "green" : "yellow"}
                                  variant="light"
                                >
                                  {isConnected ? "Active" : (connection.status ?? "Pending")}
                                </Badge>
                              )}
                            </Group>
                            {connection ? (
                              <Button
                                variant="light"
                                color="red"
                                size="xs"
                                leftSection={<RiDeleteBinLine size={14} />}
                                onClick={() => {
                                  setAccountToDelete(connection);
                                  openDeleteModal();
                                }}
                              >
                                Disconnect
                              </Button>
                            ) : (
                              <Button
                                variant="light"
                                size="xs"
                                leftSection={<RiLinkM size={14} />}
                                loading={connectingSlug === tk.slug}
                                onClick={() => handleConnect(tk.slug)}
                              >
                                Connect
                              </Button>
                            )}
                          </Stack>
                        </Card>
                      );
                    })}
              </SimpleGrid>
              {showBrowseList && (
                <>
                  <div ref={loadMoreRef} style={{ minHeight: 24 }} />
                  {toolkitsLoading && items.length > 0 && (
                    <Group justify="center" py="md">
                      <Loader size="sm" />
                      <Text size="sm" c="dimmed">
                        Loading more…
                      </Text>
                    </Group>
                  )}
                </>
              )}
            </Stack>
          )}
        </Stack>
      </Stack>

      <Modal
        opened={deleteModalOpened}
        onClose={handleCloseDeleteModal}
        title="Disconnect toolkit?"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            {accountToDelete
              ? `Disconnect "${accountToDelete.toolkit?.slug ?? "this toolkit"}"? You can connect again later.`
              : ""}
          </Text>
          <Group justify="flex-end" gap="xs">
            <Button
              variant="light"
              color="gray"
              onClick={handleCloseDeleteModal}
              disabled={!!deletingId}
            >
              Cancel
            </Button>
            <Button
              color="red"
              loading={!!deletingId}
              onClick={handleConfirmDelete}
              leftSection={<RiDeleteBinLine size={16} />}
            >
              Disconnect
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Mounted>
  );
}

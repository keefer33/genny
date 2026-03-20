import {
  Stack,
  Text,
  Card,
  Button,
  Group,
  SimpleGrid,
  TextInput,
  Loader,
  Badge,
  Anchor,
  Modal,
  Box,
  Tabs,
  ActionIcon,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  RiSearchLine,
  RiArrowLeftLine,
  RiServerLine,
  RiDeleteBinLine,
  RiLinkM,
  RiCloseLine,
} from "@remixicon/react";
import { useEffect, useState, useRef } from "react";
import { Link } from "react-router";
import Mounted from "~/shared/Mounted";
import {
  useMcpServersStore,
  type McpServerSummary,
  type McpConnectionItem,
} from "~/lib/stores/mcpserversStore";

export default function McpServers() {
  const {
    listData,
    listLoading,
    listError,
    searchQuery,
    searchInput,
    setSearchInput,
    submitSearch,
    clearSearch,
    loadList,
    loadMore,
    connections,
    connectionsLoading,
    connectionsError,
    loadConnections,
    deleteConnection,
  } = useMcpServersStore();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [connectionToDelete, setConnectionToDelete] = useState<McpConnectionItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] =
    useDisclosure(false);

  const handleCloseDeleteModal = () => {
    if (!deletingId) {
      closeDeleteModal();
      setConnectionToDelete(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!connectionToDelete) return;
    setDeletingId(connectionToDelete.connectionId);
    try {
      await deleteConnection(connectionToDelete.connectionId);
      notifications.show({
        title: "Connection removed",
        message: `"${connectionToDelete.name}" has been disconnected.`,
        color: "green",
      });
      closeDeleteModal();
      setConnectionToDelete(null);
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
    loadList({ page: 1, searchQuery });
  }, [searchQuery, loadList]);

  useEffect(() => {
    const t = setTimeout(() => submitSearch(), 100);
    return () => clearTimeout(t);
  }, [searchInput, submitSearch]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  const pagination = listData?.pagination;
  const servers: McpServerSummary[] = listData?.servers ?? [];

  const hasMore =
    !!pagination &&
    pagination.currentPage < pagination.totalPages &&
    (servers.length === 0 || servers.length < pagination.totalCount);

  useEffect(() => {
    if (!hasMore || listLoading) return;
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: "200px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, listLoading, loadMore]);

  return (
    <Mounted>
      <Stack gap="xl">
        <Group justify="space-between" align="flex-start">
          <Stack gap="xs">
            <Text size="xl" fw={700}>
              MCP Servers
            </Text>
            <Text size="sm" c="dimmed">
              Search and browse MCP servers from the Smithery registry.
            </Text>
          </Stack>
          <Button
            variant="light"
            color="gray"
            component={Link}
            to="/chats"
            leftSection={<RiArrowLeftLine size={16} />}
          >
            Back to Agents
          </Button>
        </Group>

        <Tabs defaultValue="connected">
          <Tabs.List>
            <Tabs.Tab value="connected">Connected ({connections.length})</Tabs.Tab>
            <Tabs.Tab value="search">Search servers</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="connected" pt="md">
            {connectionsLoading ? (
              <Card padding="sm" radius="xs" withBorder>
                <Group gap="xs">
                  <Loader size="sm" />
                  <Text size="sm" c="dimmed">
                    Loading your connections…
                  </Text>
                </Group>
              </Card>
            ) : connectionsError ? (
              <Card
                padding="sm"
                radius="xs"
                withBorder
                style={{ borderColor: "var(--mantine-color-red-3)" }}
              >
                <Text size="sm" c="red">
                  {connectionsError}
                </Text>
              </Card>
            ) : connections.length === 0 ? (
              <Card padding="xl" radius="xs">
                <Stack gap="md" align="center">
                  <RiServerLine size={48} color="var(--mantine-color-gray-5)" />
                  <Text c="dimmed">No connected servers yet.</Text>
                  <Text size="sm" c="dimmed">
                    Use the Search servers tab to find and connect to MCP servers.
                  </Text>
                </Stack>
              </Card>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                {connections.map((conn: McpConnectionItem) => {
                  const detailTo = conn.qualifiedName
                    ? `/mcpservers/${encodeURIComponent(conn.qualifiedName)}`
                    : "/mcpservers";
                  const displayName = conn.server_details?.displayName ?? conn.name;
                  const iconUrl = conn.server_details?.iconUrl;
                  return (
                    <Card key={conn.connectionId} padding="md" radius="sm" withBorder shadow="sm">
                      <Stack gap="xs">
                        <Box
                          component={Link}
                          to={detailTo}
                          style={{ cursor: "pointer", textDecoration: "none" }}
                        >
                          <Group gap="xs" wrap="nowrap">
                            {iconUrl ? (
                              <img
                                src={iconUrl}
                                alt=""
                                width={24}
                                height={24}
                                style={{ borderRadius: 4 }}
                              />
                            ) : (
                              <RiServerLine size={24} color="var(--mantine-color-blue-6)" />
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
                          <Text size="xs" c="dimmed" lineClamp={2} mt={4}>
                            {conn.server_details?.description || "No description"}
                          </Text>
                        </Box>
                        <Group gap="xs" justify="space-between">
                          <Badge
                            size="xs"
                            color={
                              conn.status?.state === "connected"
                                ? "green"
                                : conn.status?.state === "auth_required"
                                  ? "yellow"
                                  : "red"
                            }
                            variant="light"
                          >
                            {conn.status?.state === "connected"
                              ? "Connected"
                              : conn.status?.state === "auth_required"
                                ? "Auth required"
                                : "Error"}
                          </Badge>
                        </Group>
                        <Button
                          variant="light"
                          color="red"
                          size="xs"
                          leftSection={<RiDeleteBinLine size={14} />}
                          onClick={() => {
                            setConnectionToDelete(conn);
                            openDeleteModal();
                          }}
                        >
                          Remove Connection
                        </Button>
                      </Stack>
                    </Card>
                  );
                })}
              </SimpleGrid>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="search" pt="md">
            <Stack gap="md">
              <Card padding="md" radius="xs">
                <TextInput
                  placeholder="Search servers..."
                  leftSection={<RiSearchLine size={16} />}
                  rightSection={
                    searchInput ? (
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        size="sm"
                        onClick={clearSearch}
                        aria-label="Clear search"
                      >
                        <RiCloseLine size={18} />
                      </ActionIcon>
                    ) : null
                  }
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.currentTarget.value)}
                  style={{ maxWidth: 400 }}
                />
              </Card>

              {listError && (
                <Card
                  padding="md"
                  radius="xs"
                  withBorder
                  style={{ borderColor: "var(--mantine-color-red-3)" }}
                >
                  <Text size="sm" c="red">
                    {listError}
                  </Text>
                </Card>
              )}

              {listLoading && servers.length === 0 ? (
                <Card padding="xl" radius="xs">
                  <Group justify="center">
                    <Loader />
                  </Group>
                </Card>
              ) : servers.length === 0 ? (
                <Card padding="xl" radius="xs">
                  <Stack gap="md" align="center">
                    <RiServerLine size={48} color="var(--mantine-color-gray-5)" />
                    <Text c="dimmed">No MCP servers found.</Text>
                    {searchQuery && (
                      <Button variant="light" onClick={clearSearch}>
                        Clear search
                      </Button>
                    )}
                  </Stack>
                </Card>
              ) : (
                <Stack gap="md">
                  {pagination && (
                    <Text size="sm" c="dimmed">
                      {servers.length} of {pagination.totalCount} servers
                    </Text>
                  )}
                  <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                    {servers
                      .filter(
                        (server) =>
                          !connections.some(
                            (c) =>
                              (c.qualifiedName ?? c.server_details?.qualifiedName) ===
                              server.qualifiedName
                          )
                      )
                      .map((server) => (
                        <Card key={server.id} padding="md" radius="sm" withBorder shadow="sm">
                          <Stack gap="xs">
                            <Box
                              component={Link}
                              to={`/mcpservers/${encodeURIComponent(server.qualifiedName)}`}
                              style={{ cursor: "pointer", textDecoration: "none" }}
                            >
                              <Group gap="xs" wrap="nowrap">
                                {server.iconUrl ? (
                                  <img
                                    src={server.iconUrl}
                                    alt=""
                                    width={24}
                                    height={24}
                                    style={{ borderRadius: 4 }}
                                  />
                                ) : (
                                  <RiServerLine size={24} color="var(--mantine-color-blue-6)" />
                                )}
                                <Text
                                  c="var(--mantine-color-text)"
                                  size="sm"
                                  fw={600}
                                  lineClamp={1}
                                  style={{ flex: 1 }}
                                >
                                  {server.displayName}
                                </Text>
                              </Group>
                              <Text size="xs" c="dimmed" lineClamp={2}>
                                {server.description || "No description"}
                              </Text>
                            </Box>
                            <Group gap="xs" justify="space-between">
                              {server.verified && (
                                <Badge size="xs" color="green">
                                  Verified
                                </Badge>
                              )}
                              {server.homepage && (
                                <Anchor
                                  href={server.homepage}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  size="xs"
                                >
                                  View on Smithery
                                </Anchor>
                              )}
                              <Text size="xs" c="dimmed">
                                Used {server.useCount}×
                              </Text>
                            </Group>
                            <Button
                              component={Link}
                              to={`/mcpservers/${encodeURIComponent(server.qualifiedName)}`}
                              variant="light"
                              size="xs"
                              leftSection={<RiLinkM size={14} />}
                            >
                              Connect
                            </Button>
                          </Stack>
                        </Card>
                      ))}
                  </SimpleGrid>
                  <div ref={loadMoreRef} style={{ minHeight: 24 }} />
                  {listLoading && servers.length > 0 && (
                    <Group justify="center" py="md">
                      <Loader size="sm" />
                      <Text size="sm" c="dimmed">
                        Loading more…
                      </Text>
                    </Group>
                  )}
                </Stack>
              )}
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Stack>

      <Modal opened={deleteModalOpened} onClose={handleCloseDeleteModal} title="Remove connection?">
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            {connectionToDelete
              ? `Remove "${connectionToDelete.name}"? This will terminate the MCP session.`
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
              Remove
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Mounted>
  );
}

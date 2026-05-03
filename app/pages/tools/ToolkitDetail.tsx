import { Stack, Text, Card, Button, Group, Loader, Badge, Anchor, List, Code } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { RiArrowLeftLine, RiToolsLine, RiLinkM, RiLinkUnlink } from "@remixicon/react";
import { useEffect, useState } from "react";
import { Link, useParams, useLocation, useNavigate } from "react-router";
import Mounted from "~/shared/Mounted";
import { PageTitle } from "~/shared/PageTitle";
import {
  useToolsStore,
  type ToolkitDetail as ToolkitDetailType,
  type ToolItem,
  type ConnectedAccountItem,
} from "~/lib/stores/toolsStore";

export default function ToolkitDetail() {
  const { slug } = useParams<{ slug: string }>();
  const {
    toolkitDetail: toolkit,
    toolkitDetailLoading: loading,
    toolkitDetailError: error,
    toolkitDetailStatus: status,
    loadToolkitBySlug,
    resetDetail,
    loadTools,
    toolsData,
    toolsLoading,
    toolsError,
    loadConnectedAccounts,
    connectedAccounts,
    getConnectionForToolkit,
    createConnectLink,
    deleteConnectedAccount,
  } = useToolsStore();
  const [connectLoading, setConnectLoading] = useState(false);
  const [connection, setConnection] = useState<ConnectedAccountItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
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

  useEffect(() => {
    if (!slug) return;
    loadToolkitBySlug(decodeURIComponent(slug));
  }, [slug, loadToolkitBySlug]);

  useEffect(() => {
    if (!slug) return;
    loadTools({ toolkit_slug: decodeURIComponent(slug), limit: 100 });
  }, [slug, loadTools]);

  useEffect(() => {
    return () => resetDetail();
  }, [resetDetail]);

  useEffect(() => {
    loadConnectedAccounts();
  }, [loadConnectedAccounts]);

  useEffect(() => {
    if (!slug) {
      setConnection(null);
      return;
    }
    const conn = getConnectionForToolkit(decodeURIComponent(slug));
    setConnection(conn);
  }, [slug, connectedAccounts, getConnectionForToolkit]);

  const tools: ToolItem[] = toolsData?.items ?? [];
  const authGuideUrl = (toolkit as ToolkitDetailType | null)?.auth_guide_url;

  if (!slug) {
    return (
      <Mounted>
        <PageTitle title="Toolkit" />
        <Card padding="md" withBorder>
          <Text c="red">Toolkit slug is required.</Text>
          <Button component={Link} to="/tools" variant="light" mt="md">
            Back to Tools
          </Button>
        </Card>
      </Mounted>
    );
  }

  if (loading || (!toolkit && !error)) {
    return (
      <Mounted>
        <PageTitle title="Toolkit" />
        <Card padding="xl" radius="xs">
          <Group justify="center" gap="sm">
            <Loader />
            <Text size="sm" c="dimmed">
              Loading toolkit…
            </Text>
          </Group>
        </Card>
      </Mounted>
    );
  }

  if (error) {
    return (
      <Mounted>
        <Stack gap="md">
          <Card padding="md" withBorder style={{ borderColor: "var(--mantine-color-red-3)" }}>
            <Text c="red">{error}</Text>
            {status === 404 && (
              <Text size="sm" c="dimmed" mt="xs">
                The toolkit may not exist or may not be available.
              </Text>
            )}
          </Card>
          <Group>
            <Button
              variant="light"
              color="gray"
              component={Link}
              to="/tools"
              leftSection={<RiArrowLeftLine size={16} />}
            >
              Back to Tools
            </Button>
          </Group>
        </Stack>
      </Mounted>
    );
  }

  if (!toolkit) {
    return (
      <Mounted>
        <PageTitle title="Toolkit" />
        <Card padding="xl" radius="xs">
          <Group justify="center" gap="sm">
            <Loader />
            <Text size="sm" c="dimmed">
              Loading toolkit…
            </Text>
          </Group>
        </Card>
      </Mounted>
    );
  }

  const decodedSlug = decodeURIComponent(slug);
  const isConnected = connection?.status === "ACTIVE";

  return (
    <Mounted>
      <Button
        variant="light"
        component={Link}
        to="/tools"
        leftSection={<RiArrowLeftLine size={16} />}
        justify="flex-start"
        w="fit-content"
      >
        Back to Tools
      </Button>
      <Stack gap="xl" pt="sm">
        <Stack gap="xs">
          <Group gap="md" wrap="nowrap">
            {toolkit.meta?.logo ? (
              <img
                src={toolkit.meta.logo}
                alt=""
                width={48}
                height={48}
                style={{ borderRadius: 8 }}
              />
            ) : (
              <RiToolsLine size={48} color="var(--mantine-color-blue-6)" />
            )}
            <Stack gap={4}>
              <Text size="xl" fw={700}>
                {toolkit.name}
              </Text>
              {toolkit.meta?.app_url ? (
                <Anchor
                  href={toolkit.meta.app_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="sm"
                  c="dimmed"
                >
                  {toolkit.slug}
                </Anchor>
              ) : (
                <Text size="sm" c="dimmed">
                  {toolkit.slug}
                </Text>
              )}
            </Stack>
          </Group>
          {toolkit.meta?.description && <Text size="sm">{toolkit.meta.description}</Text>}
        </Stack>

        <Card padding="md" radius="xs">
          <Group gap="xs" mb="xs">
            <RiLinkM size={16} />
            <Text size="sm" fw={600}>
              Connect this toolkit
            </Text>
          </Group>
          <Text size="sm" c="dimmed" mb="md">
            Use manual authentication to connect your account. You’ll be sent to a Composio Connect
            Link to sign in; after that, this toolkit will be available for your agents.
          </Text>
          {authGuideUrl && (
            <Anchor
              href={authGuideUrl}
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
              mb="md"
              display="block"
            >
              View authentication guide
            </Anchor>
          )}
          {connection ? (
            <Stack gap="sm">
              <Group gap="sm">
                <Badge color={isConnected ? "green" : "yellow"} variant="light" size="sm">
                  {isConnected ? "Connected" : (connection.status ?? "Pending")}
                </Badge>
              </Group>
              <Button
                variant="light"
                color="red"
                size="xs"
                w="fit-content"
                leftSection={<RiLinkUnlink size={14} />}
                loading={deleteLoading}
                onClick={async () => {
                  setDeleteLoading(true);
                  try {
                    const ok = await deleteConnectedAccount(connection.id);
                    if (ok) {
                      setConnection(null);
                      loadConnectedAccounts();
                      notifications.show({
                        title: "Disconnected",
                        message: "You can connect again anytime.",
                        color: "gray",
                      });
                    }
                  } catch (err) {
                    notifications.show({
                      title: "Failed to disconnect",
                      message: err instanceof Error ? err.message : "Unknown error",
                      color: "red",
                    });
                  } finally {
                    setDeleteLoading(false);
                  }
                }}
              >
                Disconnect
              </Button>
            </Stack>
          ) : (
            <Button
              variant="light"
              w="fit-content"
              loading={connectLoading}
              onClick={async () => {
                setConnectLoading(true);
                try {
                  const result = await createConnectLink({
                    toolkit_slug: decodedSlug,
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
                  setConnectLoading(false);
                }
              }}
            >
              Connect with Composio
            </Button>
          )}
        </Card>

        {toolsError && (
          <Card
            padding="sm"
            radius="xs"
            withBorder
            style={{ borderColor: "var(--mantine-color-red-3)" }}
          >
            <Text size="sm" c="red">
              {toolsError}
            </Text>
          </Card>
        )}

        {(toolsLoading || tools.length > 0) && (
          <Card padding="md" radius="xs">
            <Group gap="xs" mb="sm">
              <RiToolsLine size={16} />
              <Text size="sm" fw={600}>
                Tools ({toolsLoading ? "…" : tools.length})
              </Text>
            </Group>
            {toolsLoading && tools.length === 0 ? (
              <Group gap="sm">
                <Loader size="sm" />
                <Text size="sm" c="dimmed">
                  Loading tools…
                </Text>
              </Group>
            ) : (
              <List size="sm" spacing="xs">
                {tools.map((t) => (
                  <List.Item key={t.slug}>
                    <Code>{t.slug}</Code>
                    {t.description && (
                      <Text size="xs" c="dimmed" component="span" ml="xs">
                        — {t.description}
                      </Text>
                    )}
                  </List.Item>
                ))}
              </List>
            )}
          </Card>
        )}

        {toolkit.meta?.app_url && (
          <Card padding="md" radius="xs">
            <Group gap="xs" mb="xs">
              <RiLinkM size={16} />
              <Text size="sm" fw={600}>
                App
              </Text>
            </Group>
            <Anchor href={toolkit.meta.app_url} target="_blank" rel="noopener noreferrer" size="sm">
              {toolkit.meta.app_url}
            </Anchor>
          </Card>
        )}
      </Stack>
    </Mounted>
  );
}

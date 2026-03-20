import {
  Stack,
  Text,
  Card,
  Button,
  Group,
  Loader,
  Badge,
  Anchor,
  List,
  Code,
  TextInput,
  PasswordInput,
  NumberInput,
  Checkbox,
  Select,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  RiArrowLeftLine,
  RiServerLine,
  RiLinkM,
  RiToolsLine,
  RiLink,
  RiLinkUnlink,
} from "@remixicon/react";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import Mounted from "~/shared/Mounted";
import { PageTitle } from "~/shared/PageTitle";
import { useMcpServersStore } from "~/lib/stores/mcpserversStore";

export default function McpServerDetail() {
  const { name } = useParams<{ name: string }>();
  const {
    detailServer: server,
    detailLoading: loading,
    detailError: error,
    detailStatus: status,
    loadServer,
    resetDetail,
    createConnection,
    getConnectionForServer,
    deleteConnection,
  } = useMcpServersStore();
  const [connectLoading, setConnectLoading] = useState(false);
  const [existingConnection, setExistingConnection] = useState<
    | {
        connected: true;
        connection: {
          connectionId: string;
          name?: string;
          status?: { state: string };
        };
      }
    | { connected: false }
    | null
  >(null);
  const [existingConnectionLoading, setExistingConnectionLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const authPollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const configSchema = server?.connections?.find(
    (c) => c.type === "http" && c.configSchema && typeof c.configSchema === "object"
  )?.configSchema as
    | { type?: string; required?: string[]; properties?: Record<string, Record<string, unknown>> }
    | undefined;

  const [configParams, setConfigParams] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (!configSchema?.properties) {
      setConfigParams({});
      return;
    }
    const defaults: Record<string, unknown> = {};
    for (const [key, prop] of Object.entries(configSchema.properties)) {
      if (prop && typeof prop === "object" && "default" in prop) {
        defaults[key] = (prop as { default?: unknown }).default;
      }
    }
    setConfigParams((prev) => ({ ...defaults, ...prev }));
  }, [configSchema, server?.qualifiedName]);

  const AUTH_POLL_INTERVAL_MS = 5000;
  const AUTH_POLL_DURATION_MS = 120000; // 2 minutes

  const startAuthPolling = (qualifiedName: string) => {
    if (authPollIntervalRef.current) {
      clearInterval(authPollIntervalRef.current);
      authPollIntervalRef.current = null;
    }
    const pollUntil = Date.now() + AUTH_POLL_DURATION_MS;
    authPollIntervalRef.current = setInterval(() => {
      if (Date.now() > pollUntil) {
        if (authPollIntervalRef.current) {
          clearInterval(authPollIntervalRef.current);
          authPollIntervalRef.current = null;
        }
        return;
      }
      getConnectionForServer(qualifiedName).then((result) => {
        setExistingConnection(
          result.connected && result.connection
            ? { connected: true, connection: result.connection }
            : { connected: false }
        );
        if (result.connected && result.connection?.status?.state === "connected") {
          if (authPollIntervalRef.current) {
            clearInterval(authPollIntervalRef.current);
            authPollIntervalRef.current = null;
          }
          notifications.show({
            title: "Connection ready",
            message: "Authorization completed successfully.",
            color: "green",
          });
        }
      });
    }, AUTH_POLL_INTERVAL_MS);
  };

  useEffect(() => {
    if (!name) return;
    loadServer(decodeURIComponent(name));
  }, [name, loadServer]);

  useEffect(() => {
    return () => resetDetail();
  }, [resetDetail]);

  useEffect(() => {
    return () => {
      if (authPollIntervalRef.current) {
        clearInterval(authPollIntervalRef.current);
        authPollIntervalRef.current = null;
      }
    };
  }, []);

  const mcpUrl =
    server?.deploymentUrl ??
    server?.connections?.find((c) => c.type === "http")?.deploymentUrl ??
    null;

  function buildParamsFromForm(
    form: Record<string, unknown>,
    schema: { required?: string[]; properties?: Record<string, Record<string, unknown>> }
  ): Record<string, unknown> {
    const params: Record<string, unknown> = {};
    const props = schema.properties ?? {};
    for (const key of Object.keys(props)) {
      const prop = props[key] as { type?: string; enum?: unknown[] } | undefined;
      if (!prop) continue;
      let value = form[key];
      if (value === undefined || value === "") continue;
      const type = prop.type;
      if (type === "array" && typeof value === "string") {
        value = value
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      if (type === "number" && typeof value === "string") value = Number(value);
      if (type === "boolean") value = Boolean(value);
      params[key] = value;
    }
    return params;
  }

  function getConfigFormErrors(): string[] {
    if (!configSchema?.required?.length) return [];
    const errors: string[] = [];
    for (const key of configSchema.required) {
      const v = configParams[key];
      if (v === undefined || v === "" || (Array.isArray(v) && v.length === 0))
        errors.push(`${key} is required`);
    }
    return errors;
  }

  useEffect(() => {
    if (!server?.qualifiedName || !mcpUrl) {
      setExistingConnection(null);
      return;
    }
    let cancelled = false;
    setExistingConnectionLoading(true);
    getConnectionForServer(server.qualifiedName).then((result) => {
      if (!cancelled) {
        setExistingConnection(
          result.connected && result.connection
            ? { connected: true, connection: result.connection }
            : { connected: false }
        );
        setExistingConnectionLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [server?.qualifiedName, mcpUrl, getConnectionForServer]);

  if (!name) {
    return (
      <Mounted>
        <PageTitle title="MCP Server" />
        <Card padding="md" withBorder>
          <Text c="red">Server name is required.</Text>
          <Button component={Link} to="/mcpservers" variant="light" mt="md">
            Back to MCP Servers
          </Button>
        </Card>
      </Mounted>
    );
  }

  if (loading || (!server && !error)) {
    return (
      <Mounted>
        <PageTitle title="MCP Server" />
        <Card padding="xl" radius="xs">
          <Group justify="center" gap="sm">
            <Loader />
            <Text size="sm" c="dimmed">
              Loading server…
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
                The server or namespace may not exist in the Smithery registry.
              </Text>
            )}
          </Card>
          <Group>
            <Button
              variant="light"
              color="gray"
              component={Link}
              to="/mcpservers"
              leftSection={<RiArrowLeftLine size={16} />}
            >
              Back to MCP Servers
            </Button>
            <Button variant="light" component={Link} to="/chats">
              Back to Agents
            </Button>
          </Group>
        </Stack>
      </Mounted>
    );
  }

  if (!server) {
    return (
      <Mounted>
        <PageTitle title="MCP Server" />
        <Card padding="xl" radius="xs">
          <Group justify="center" gap="sm">
            <Loader />
            <Text size="sm" c="dimmed">
              Loading server…
            </Text>
          </Group>
        </Card>
      </Mounted>
    );
  }

  return (
    <Mounted>
      <Button
        variant="light"
        component={Link}
        to="/mcpservers"
        leftSection={<RiArrowLeftLine size={16} />}
        justify="flex-start"
        w="fit-content"
      >
        Back to MCP Servers
      </Button>
      <Stack gap="xl" pt="sm">
        <Stack gap="xs">
          <Group gap="md" wrap="nowrap">
            {server.iconUrl ? (
              <img src={server.iconUrl} alt="" width={48} height={48} style={{ borderRadius: 8 }} />
            ) : (
              <RiServerLine size={48} color="var(--mantine-color-blue-6)" />
            )}
            <Stack gap={4}>
              <Text size="xl" fw={700}>
                {server.displayName}
              </Text>
            </Stack>
          </Group>
          {server.description && <Text size="sm">{server.description}</Text>}
        </Stack>

        <Card padding="md" radius="xs">
          <Group gap="xs" mb="xs">
            <RiLink size={16} />
            <Text size="sm" fw={600}>
              Connect to this server
            </Text>
          </Group>
          <Text size="sm" c="dimmed" mb="md">
            Create a connection via Smithery Connect to use this MCP server with your agents. OAuth
            and credentials are handled for you.
          </Text>
          {!mcpUrl ? (
            <Text size="sm" c="dimmed">
              This server does not expose a remote URL, so it cannot be connected via Smithery
              Connect. Use a local or stdio setup instead.
            </Text>
          ) : existingConnectionLoading ? (
            <Group gap="sm">
              <Loader size="sm" />
              <Text size="sm" c="dimmed">
                Checking connection…
              </Text>
            </Group>
          ) : existingConnection?.connected && existingConnection.connection ? (
            <Stack gap="sm">
              <Group gap="sm">
                <Badge color="green" variant="light" size="sm">
                  Connected
                </Badge>
                {existingConnection.connection.status?.state === "auth_required" && (
                  <Group gap="xs">
                    <Badge color="yellow" variant="light" size="sm">
                      Authorization required
                    </Badge>
                    {existingConnection.connection.status &&
                      "authorizationUrl" in existingConnection.connection.status &&
                      typeof existingConnection.connection.status.authorizationUrl === "string" && (
                        <Button
                          variant="subtle"
                          size="xs"
                          w="fit-content"
                          onClick={() => {
                            const status = existingConnection.connection.status as {
                              state: string;
                              authorizationUrl?: string;
                            };
                            const url = status?.authorizationUrl;
                            if (!url || typeof url !== "string") return;
                            window.open(url, "_blank", "noopener,noreferrer");
                            startAuthPolling(server!.qualifiedName);
                            notifications.show({
                              title: "Checking connection",
                              message: "We’ll check every few seconds for up to 2 minutes.",
                              color: "blue",
                            });
                          }}
                        >
                          Complete authorization
                        </Button>
                      )}
                  </Group>
                )}
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
                    const ok = await deleteConnection(existingConnection.connection.connectionId);
                    if (ok) {
                      setExistingConnection({ connected: false });
                      notifications.show({
                        title: "Connection removed",
                        message: "You can create a new connection anytime.",
                        color: "gray",
                      });
                    }
                  } catch (err) {
                    notifications.show({
                      title: "Failed to remove connection",
                      message: err instanceof Error ? err.message : "Unknown error",
                      color: "red",
                    });
                  } finally {
                    setDeleteLoading(false);
                  }
                }}
              >
                Remove connection
              </Button>
            </Stack>
          ) : (
            <Stack gap="md">
              {configSchema?.properties && Object.keys(configSchema.properties).length > 0 && (
                <Stack gap="xs">
                  <Text size="sm" fw={600}>
                    Configuration
                  </Text>
                  <Text size="xs" c="dimmed">
                    Optional connection parameters sent to the server (e.g. API keys). Stored
                    securely as metadata.
                  </Text>
                  {Object.entries(configSchema.properties).map(([key, prop]) => {
                    const p = prop as {
                      type?: string;
                      description?: string;
                      default?: unknown;
                      enum?: unknown[];
                      items?: { type?: string };
                    };
                    const required = configSchema.required?.includes(key);
                    const isSensitive = /key|secret|password|token|apiKey/i.test(key);
                    const value = configParams[key];
                    const setValue = (v: unknown) =>
                      setConfigParams((prev) => ({ ...prev, [key]: v }));

                    if (p.enum && Array.isArray(p.enum)) {
                      return (
                        <Select
                          key={key}
                          label={key}
                          description={p.description}
                          placeholder={required ? "Required" : "Optional"}
                          required={required}
                          value={value != null ? String(value) : ""}
                          onChange={(v) => setValue(v ?? "")}
                          data={p.enum.map((e) => ({ value: String(e), label: String(e) }))}
                          size="sm"
                        />
                      );
                    }
                    if (p.type === "number") {
                      return (
                        <NumberInput
                          key={key}
                          label={key}
                          description={p.description}
                          placeholder={required ? "Required" : "Optional"}
                          required={required}
                          value={value !== undefined && value !== "" ? Number(value) : undefined}
                          onChange={(v) => setValue(v === "" ? undefined : v)}
                          size="sm"
                        />
                      );
                    }
                    if (p.type === "boolean") {
                      return (
                        <Checkbox
                          key={key}
                          label={key}
                          description={p.description}
                          checked={Boolean(value)}
                          onChange={(e) => setValue(e.currentTarget.checked)}
                          size="sm"
                        />
                      );
                    }
                    if (p.type === "array") {
                      return (
                        <TextInput
                          key={key}
                          label={key}
                          description={p.description ?? "Comma-separated values"}
                          placeholder={required ? "Required" : "Optional"}
                          required={required}
                          value={
                            Array.isArray(value) ? value.join(", ") : ((value as string) ?? "")
                          }
                          onChange={(e) => setValue(e.currentTarget.value)}
                          size="sm"
                        />
                      );
                    }
                    return isSensitive ? (
                      <PasswordInput
                        key={key}
                        label={key}
                        description={p.description}
                        placeholder={required ? "Required" : "Optional"}
                        required={required}
                        value={(value as string) ?? ""}
                        onChange={(e) => setValue(e.currentTarget.value)}
                        size="sm"
                      />
                    ) : (
                      <TextInput
                        key={key}
                        label={key}
                        description={p.description}
                        placeholder={required ? "Required" : "Optional"}
                        required={required}
                        value={(value as string) ?? ""}
                        onChange={(e) => setValue(e.currentTarget.value)}
                        size="sm"
                      />
                    );
                  })}
                </Stack>
              )}
              <Button
                variant="light"
                w="fit-content"
                loading={connectLoading}
                onClick={async () => {
                  const configErrors = getConfigFormErrors();
                  if (configErrors.length > 0) {
                    notifications.show({
                      title: "Configuration required",
                      message: configErrors.join(". "),
                      color: "yellow",
                    });
                    return;
                  }
                  setConnectLoading(true);
                  try {
                    const params =
                      configSchema?.properties && Object.keys(configSchema.properties).length > 0
                        ? buildParamsFromForm(configParams, configSchema)
                        : undefined;
                    const conn = await createConnection({
                      serverDetails: server,
                      params: params && Object.keys(params).length > 0 ? params : undefined,
                    });
                    if (!conn) {
                      notifications.show({
                        title: "Not signed in",
                        message: "Sign in to create MCP connections.",
                        color: "yellow",
                      });
                      return;
                    }
                    const st = conn.status;
                    if (st?.state === "auth_required" && st.authorizationUrl) {
                      setExistingConnection({ connected: true, connection: conn });
                      window.open(st.authorizationUrl!, "_blank", "noopener,noreferrer");
                      startAuthPolling(server.qualifiedName);
                      notifications.show({
                        title: "Authorization required",
                        message:
                          "Complete sign-in in the new window. We’ll check every few seconds for up to 2 minutes.",
                        color: "blue",
                      });
                      return;
                    }
                    if (st?.state === "connected") {
                      setExistingConnection({ connected: true, connection: conn });
                      notifications.show({
                        title: "Connected",
                        message: `Connection "${conn.name}" is ready to use.`,
                        color: "green",
                      });
                      return;
                    }
                    if (st?.state === "error") {
                      notifications.show({
                        title: "Connection failed",
                        message: st.message ?? "Unknown error",
                        color: "red",
                      });
                      return;
                    }
                    setExistingConnection({ connected: true, connection: conn });
                    notifications.show({
                      title: "Connection created",
                      message: `Connection ID: ${conn.connectionId}`,
                      color: "green",
                    });
                  } catch (err) {
                    notifications.show({
                      title: "Failed to create connection",
                      message: err instanceof Error ? err.message : "Unknown error",
                      color: "red",
                    });
                  } finally {
                    setConnectLoading(false);
                  }
                }}
              >
                Create connection
              </Button>
            </Stack>
          )}
        </Card>

        {server.tools && server.tools.length > 0 && (
          <Card padding="md" radius="xs">
            <Group gap="xs" mb="sm">
              <RiToolsLine size={16} />
              <Text size="sm" fw={600}>
                Tools ({server.tools.length})
              </Text>
            </Group>
            <List size="sm" spacing="xs">
              {server.tools.map((t) => (
                <List.Item key={t.name}>
                  <Code>{t.name}</Code>
                  {t.description && (
                    <Text size="xs" c="dimmed" component="span" ml="xs">
                      — {t.description}
                    </Text>
                  )}
                </List.Item>
              ))}
            </List>
          </Card>
        )}

        {server.connections && server.connections.length > 0 && (
          <Card padding="md" radius="xs">
            <Text size="sm" fw={600} mb="sm">
              Connections
            </Text>
            <Stack gap="xs">
              {server.connections.map((conn, i) => (
                <Group key={i} gap="sm">
                  <Badge size="sm" variant="light">
                    {conn.type}
                  </Badge>
                  {conn.type === "http" && conn.deploymentUrl && (
                    <Anchor
                      href={conn.deploymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="xs"
                    >
                      {conn.deploymentUrl}
                    </Anchor>
                  )}
                  {conn.type === "stdio" && (conn.bundleUrl || conn.runtime) && (
                    <Text size="xs" c="dimmed">
                      {[conn.runtime, conn.bundleUrl].filter(Boolean).join(" · ")}
                    </Text>
                  )}
                </Group>
              ))}
            </Stack>
          </Card>
        )}

        {server.deploymentUrl && (
          <Card padding="md" radius="xs">
            <Group gap="xs" mb="xs">
              <RiLinkM size={16} />
              <Text size="sm" fw={600}>
                Deployment URL
              </Text>
            </Group>
            <Anchor href={server.deploymentUrl} target="_blank" rel="noopener noreferrer" size="sm">
              {server.deploymentUrl}
            </Anchor>
          </Card>
        )}

        {server.resources && server.resources.length > 0 && (
          <Card padding="md" radius="xs" withBorder>
            <Text size="sm" fw={600} mb="sm">
              Resources ({server.resources.length})
            </Text>
            <List size="sm" spacing="xs">
              {server.resources.map((r) => (
                <List.Item key={r.uri}>
                  <Code>{r.name}</Code>
                  <Text size="xs" c="dimmed" component="span" ml="xs">
                    {r.uri}
                  </Text>
                  {r.description && (
                    <Text size="xs" c="dimmed" display="block">
                      {r.description}
                    </Text>
                  )}
                </List.Item>
              ))}
            </List>
          </Card>
        )}

        {server.prompts && server.prompts.length > 0 && (
          <Card padding="md" radius="xs" withBorder>
            <Text size="sm" fw={600} mb="sm">
              Prompts ({server.prompts.length})
            </Text>
            <List size="sm" spacing="xs">
              {server.prompts.map((p) => (
                <List.Item key={p.name}>
                  <Code>{p.name}</Code>
                  {p.description && (
                    <Text size="xs" c="dimmed" component="span" ml="xs">
                      — {p.description}
                    </Text>
                  )}
                </List.Item>
              ))}
            </List>
          </Card>
        )}

        {server.eventTopics && server.eventTopics.length > 0 && (
          <Card padding="md" radius="xs" withBorder>
            <Text size="sm" fw={600} mb="sm">
              Event topics ({server.eventTopics.length})
            </Text>
            <List size="sm" spacing="xs">
              {server.eventTopics.map((e) => (
                <List.Item key={e.topic}>
                  <Code>{e.topic}</Code>
                  {e.name !== e.topic && (
                    <Text size="xs" c="dimmed" component="span" ml="xs">
                      — {e.name}
                    </Text>
                  )}
                </List.Item>
              ))}
            </List>
          </Card>
        )}
      </Stack>
    </Mounted>
  );
}

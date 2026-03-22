import { Avatar, Button, Card, Group, MultiSelect, ScrollArea, Stack, Text } from "@mantine/core";
import { RiToolsLine } from "@remixicon/react";
import { Link } from "react-router";
import { useMantineColorScheme, useMantineTheme } from "@mantine/core";
import type { ConnectedAccountItem } from "~/lib/stores/toolsStore";
import type { ToolkitItem } from "~/lib/stores/toolsStore";

export interface ToolkitOption {
  slug: string;
  name: string;
  logo?: string;
}

export interface ToolOption {
  slug: string;
  name: string;
}

/**
 * Builds a unique list of toolkits from connected accounts, enriched with name/logo from toolkit metadata.
 */
export function buildToolkitsFromConnections(
  connectedAccounts: ConnectedAccountItem[],
  toolkitItems: ToolkitItem[] | null | undefined
): ToolkitOption[] {
  const items = toolkitItems ?? [];
  const bySlug = new Map<string, ToolkitOption>();
  for (const conn of connectedAccounts) {
    const slug = conn.toolkit?.slug ?? "unknown";
    if (bySlug.has(slug)) continue;
    const meta = items.find((i) => i.slug === slug);
    bySlug.set(slug, {
      slug,
      name: meta?.name ?? slug,
      logo: meta?.meta?.logo,
    });
  }
  return Array.from(bySlug.values());
}

interface ToolkitSelectorListProps {
  toolkits: ToolkitOption[];
  /** Map toolkit slug -> list of available tools (slug + name). */
  toolsByToolkit: Record<string, ToolOption[]>;
  /** Map toolkit slug -> selected tool slugs. */
  selectedTools: Record<string, string[]>;
  onToolsChange: (toolkitSlug: string, toolSlugs: string[]) => void;
  /** When set, wraps the list in ScrollArea with this max height (e.g. for modals). */
  scrollMaxHeight?: number;
  loading?: boolean;
}

export default function ToolkitSelectorList({
  toolkits,
  toolsByToolkit,
  selectedTools,
  onToolsChange,
  scrollMaxHeight,
  loading = false,
}: ToolkitSelectorListProps) {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  const emptyState = (
    <Card
      p="lg"
      radius="sm"
      style={{
        backgroundColor: colorScheme === "dark" ? theme.colors.dark[6] : theme.colors.gray[0],
      }}
    >
      <Stack align="center" gap="sm">
        <RiToolsLine size={40} color="var(--mantine-color-gray-5)" />
        <Text size="sm" c="dimmed" ta="center">
          No tools connected. Connect toolkits from the Tools page to attach them here.
        </Text>
        <Button
          component={Link}
          to="/tools"
          variant="light"
          size="xs"
          leftSection={<RiToolsLine size={14} />}
        >
          Go to Tools
        </Button>
      </Stack>
    </Card>
  );

  const list = (
    <Stack gap="md">
      {toolkits.map((tk) => {
        const availableTools = toolsByToolkit[tk.slug] ?? [];
        const selected = selectedTools[tk.slug] ?? [];
        const options = availableTools.map((t) => ({ value: t.slug, label: t.name || t.slug }));
        return (
          <Card key={tk.slug} p="sm" radius="sm">
            <Stack gap="xs">
              <Group wrap="nowrap" gap="sm">
                <Avatar radius="sm" size="md" src={tk.logo}>
                  <RiToolsLine size={24} color="var(--mantine-color-blue-6)" />
                </Avatar>
                <Text size="sm" fw={500} style={{ flex: 1 }} lineClamp={1}>
                  {tk.name}
                </Text>
              </Group>
              <MultiSelect
                size="xs"
                placeholder={loading ? "Loading tools…" : "Select tools to enable"}
                data={options}
                value={selected}
                onChange={(value) => onToolsChange(tk.slug, value)}
                searchable
                clearable
                disabled={loading}
              />
            </Stack>
          </Card>
        );
      })}
    </Stack>
  );

  if (toolkits.length === 0) {
    return emptyState;
  }

  if (scrollMaxHeight != null) {
    return (
      <ScrollArea.Autosize mah={scrollMaxHeight} offsetScrollbars={true}>
        {list}
      </ScrollArea.Autosize>
    );
  }

  return list;
}

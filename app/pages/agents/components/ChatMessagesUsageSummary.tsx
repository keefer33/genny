import { Divider, Group, Paper, Stack, Text } from "@mantine/core";
import { useMemo } from "react";
import type { ChatMetadata, ChatRow, ChatUIMessage } from "~/lib/stores/chatsStore";

export function formatUsd(amount: number): string {
  if (!Number.isFinite(amount)) return "—";
  return `$${amount.toFixed(4)}`;
}

export function summarizeUsage(chat: ChatRow | null | undefined, messages: ChatUIMessage[]) {
  const metadata = (chat?.metadata ?? null) as ChatMetadata | null;
  const generations = metadata?.generations ?? [];

  let generationsTotal = 0;
  const generationRows: { id: string; cost: number; slug?: string }[] = [];
  for (const g of generations) {
    const cost = g.tool_result?.cost;
    if (typeof cost !== "number" || !Number.isFinite(cost) || cost < 0) continue;
    generationsTotal += cost;
    const id = (g.generation_id ?? "").trim() || "—";
    const slug =
      typeof g.tool_call?.tool_slug === "string"
        ? g.tool_call.tool_slug.replace(/^LOCAL_GENNY_BOT_/, "")
        : undefined;
    generationRows.push({ id, cost, slug });
  }

  let llmCost = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  let totalTokens = 0;

  for (const m of messages) {
    const u = m.usage;
    if (!u) continue;
    if (typeof u.total_cost === "number" && Number.isFinite(u.total_cost)) {
      llmCost += u.total_cost;
    }
    if (typeof u.input_tokens === "number" && Number.isFinite(u.input_tokens))
      inputTokens += u.input_tokens;
    if (typeof u.output_tokens === "number" && Number.isFinite(u.output_tokens))
      outputTokens += u.output_tokens;
    if (typeof u.total_tokens === "number" && Number.isFinite(u.total_tokens))
      totalTokens += u.total_tokens;
  }

  const grandTotal = llmCost + generationsTotal;

  return {
    generationsTotal,
    generationRows,
    llmCost,
    inputTokens,
    outputTokens,
    totalTokens,
    grandTotal,
  };
}

export default function ChatMessagesUsageSummary({
  chat,
  messages,
  variant = "panel",
}: {
  chat: ChatRow | null | undefined;
  messages: ChatUIMessage[];
  variant?: "panel" | "popover";
}) {
  const s = useMemo(() => summarizeUsage(chat, messages), [chat, messages]);

  const content = (
    <Stack gap={6}>
      <Text size="sm" fw={600}>
        Usage
      </Text>

      <Group gap="xs" wrap="wrap">
        <Text size="sm">
          <Text span fw={500} component="span">
            LLM (messages)
          </Text>
          {`: ${formatUsd(s.llmCost)}`}
          <Text span c="dimmed" size="xs" component="span" ml={6}>
            · {s.inputTokens.toLocaleString()} in / {s.outputTokens.toLocaleString()} out ·{" "}
            {s.totalTokens.toLocaleString()} tokens
          </Text>
        </Text>
      </Group>

      <Stack gap={4}>
        <Text size="sm">
          <Text span fw={500} component="span">
            Generations
          </Text>
          {`: ${formatUsd(s.generationsTotal)} (${s.generationRows.length})`}
        </Text>
        {s.generationRows.map((row, i) => (
          <Text
            key={`${row.id}:${i}`}
            size="xs"
            c="dimmed"
            pl="md"
            style={{ fontFamily: "var(--mantine-font-monospace)" }}
          >
            {row.id.length > 12 ? `${row.id.slice(0, 8)}…` : row.id}
            {row.slug ? ` · ${row.slug}` : ""} · {formatUsd(row.cost)}
          </Text>
        ))}
      </Stack>

      <Divider my={4} />

      <Group justify="space-between" wrap="nowrap">
        <Text size="sm" fw={700}>
          Total
        </Text>
        <Text size="sm" fw={700}>
          {formatUsd(s.grandTotal)}
        </Text>
      </Group>
    </Stack>
  );

  if (variant === "popover") return content;

  return (
    <Paper withBorder p="sm" radius="md" mx="md" mt="xs" mb="xs">
      {content}
    </Paper>
  );
}

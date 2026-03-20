import { Group, Text } from "@mantine/core";
import React from "react";

export type ModelPricing = {
  input?: string | number;
  output?: string | number;
  input_cache_read?: string | number;
  input_cache_write?: string | number;
};

function formatUsdPerMillion(value: unknown) {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : parseFloat(String(value));
  if (!Number.isFinite(n)) return null;
  return `$${n.toFixed(2)}`;
}

export function formatContextWindowRoundedUp(raw: unknown) {
  const num = typeof raw === "number" ? raw : parseFloat(String(raw ?? ""));
  if (!Number.isFinite(num) || num <= 0) return null;

  const million = 1_000_000;
  const thousand = 1_000;

  if (num >= million) return `${Math.ceil(num / million)}M`;
  if (num >= thousand) return `${Math.ceil(num / thousand)}K`;
  return String(num);
}

export function ModelPricingDetails({
  pricing,
  contextWindow,
  showContext = true,
}: {
  pricing?: ModelPricing | null;
  contextWindow?: unknown;
  showContext?: boolean;
}) {
  const input = formatUsdPerMillion(pricing?.input);
  const output = formatUsdPerMillion(pricing?.output);
  const cacheRead = formatUsdPerMillion(pricing?.input_cache_read);
  const cacheWrite = formatUsdPerMillion(pricing?.input_cache_write);
  const formattedContext = formatContextWindowRoundedUp(contextWindow);

  return (
    <Group gap="xs">
      {input && (
        <Group gap="xs">
          <Text size="sm" fw={600}>
            Input:
          </Text>
          <Text size="sm" c="dimmed">
            {input} / 1M
          </Text>
        </Group>
      )}
      {output && (
        <Group gap="xs">
          <Text size="sm" fw={600}>
            Output:
          </Text>
          <Text size="sm" c="dimmed">
            {output} / 1M
          </Text>
        </Group>
      )}
      {/*
      {cacheRead && (
        <Group gap="xs">
          <Text size="sm">Cache read:</Text>
          <Text size="sm" c="dimmed">
            {cacheRead} / 1M
          </Text>
        </Group>
      )}
      {cacheWrite && (
        <Group gap="xs">
          <Text size="sm">Cache write:</Text>
          <Text size="sm" c="dimmed">
            {cacheWrite} / 1M
          </Text>
        </Group>
      )}
      */}
      {showContext && formattedContext && (
        <Group gap="xs">
          <Text size="sm">Context:</Text>
          <Text size="sm" c="dimmed">
            {formattedContext}
          </Text>
        </Group>
      )}
    </Group>
  );
}

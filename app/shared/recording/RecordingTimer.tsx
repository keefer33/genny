import { Group, Text } from "@mantine/core";
import { RiTimeLine } from "@remixicon/react";
import { formatRecordingDuration } from "~/lib/recording/formatDuration";

export function RecordingTimer({
  durationMs,
  maxDurationSec,
  recording,
}: {
  durationMs: number;
  maxDurationSec?: number;
  recording?: boolean;
}) {
  const label = formatRecordingDuration(durationMs);
  const maxLabel =
    maxDurationSec != null ? ` / ${formatRecordingDuration(maxDurationSec * 1000)}` : "";

  return (
    <Group gap={6} wrap="nowrap">
      <RiTimeLine
        size={16}
        color={recording ? "var(--mantine-color-red-6)" : "var(--mantine-color-dimmed)"}
      />
      <Text size="sm" fw={500} c={recording ? "red" : "dimmed"}>
        {label}
        {maxLabel}
      </Text>
    </Group>
  );
}

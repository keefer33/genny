import { Progress, Stack, Text } from "@mantine/core";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { formatDuration, isGenerationsHistoryInFlight } from "~/lib/generationsHistoryUtils";
import { GENERATIONS_HISTORY_THUMB_H } from "~/lib/generationsHistoryUtils";

export function HistoryRunLoadingThumb({ status, created_at }) {
  const inFlight = isGenerationsHistoryInFlight(status);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!inFlight) return;
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [inFlight]);

  if (!inFlight) return null;

  const elapsedSec = Math.max(0, Math.floor((nowMs - dayjs(created_at).valueOf()) / 1000));

  return (
    <Stack
      gap="sm"
      align="stretch"
      justify="center"
      px="md"
      py="sm"
      h={GENERATIONS_HISTORY_THUMB_H}
      style={{ boxSizing: "border-box" }}
    >
      <Text
        ta="center"
        size="xl"
        fw={700}
        c="orange.7"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {formatDuration(elapsedSec)}
      </Text>
      <Progress color="orange" radius="lg" value={100} animated />
    </Stack>
  );
}

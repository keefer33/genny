import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { isPlaygroundRunHistoryInFlight } from "~/lib/playgroundRunHistoryUtils";

export function HistoryRunDurationLabel({ status, created_at, duration }) {
  const inFlight = isPlaygroundRunHistoryInFlight(status);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!inFlight) return;
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [inFlight]);

  if (inFlight) {
    const start = dayjs(created_at).valueOf();
    const elapsedSec = Math.max(0, Math.floor((nowMs - start) / 1000));
    return `${elapsedSec}s`;
  }
  if (duration != null && Number.isFinite(duration)) {
    return `${duration}s`;
  }
  return "—";
}

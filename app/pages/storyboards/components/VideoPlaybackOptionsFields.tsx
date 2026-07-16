import { Group, NumberInput, Stack } from "@mantine/core";
import type { VideoPlaybackFormValues } from "~/pages/storyboards/videoPlaybackOptions";

type VideoPlaybackOptionsFieldsProps = {
  values: VideoPlaybackFormValues;
  onChange: (patch: Partial<VideoPlaybackFormValues>) => void;
  disabled?: boolean;
};

export function VideoPlaybackOptionsFields({
  values,
  onChange,
  disabled = false,
}: VideoPlaybackOptionsFieldsProps) {
  return (
    <Stack gap="sm">
      <Group grow align="flex-start">
        <NumberInput
          label="Trim start (frames)"
          min={0}
          disabled={disabled}
          value={values.trimBefore}
          onChange={(value) => {
            if (value === "" || value === "-") return;
            const parsed = typeof value === "number" ? value : Number(value);
            if (!Number.isFinite(parsed)) return;
            onChange({ trimBefore: Math.max(0, Math.round(parsed)) });
          }}
        />
        <NumberInput
          label="Trim end (frames)"
          min={0}
          disabled={disabled}
          value={values.trimAfter ?? ""}
          onChange={(value) => {
            if (value === "" || value === "-") {
              onChange({ trimAfter: null });
              return;
            }
            const parsed = typeof value === "number" ? value : Number(value);
            if (!Number.isFinite(parsed)) return;
            onChange({ trimAfter: Math.max(0, Math.round(parsed)) });
          }}
        />
      </Group>
      <Group grow align="flex-start">
        <NumberInput
          label="Volume"
          min={0}
          max={1}
          step={0.1}
          decimalScale={2}
          disabled={disabled}
          value={values.volume}
          onChange={(value) => {
            if (value === "" || value === "-") return;
            const parsed = typeof value === "number" ? value : Number(value);
            if (!Number.isFinite(parsed)) return;
            onChange({ volume: Math.min(1, Math.max(0, parsed)) });
          }}
        />
        <NumberInput
          label="Speed"
          min={0.25}
          max={4}
          step={0.25}
          decimalScale={2}
          disabled={disabled}
          value={values.playbackRate}
          onChange={(value) => {
            if (value === "" || value === "-") return;
            const parsed = typeof value === "number" ? value : Number(value);
            if (!Number.isFinite(parsed)) return;
            onChange({ playbackRate: Math.min(4, Math.max(0.25, parsed)) });
          }}
        />
      </Group>
    </Stack>
  );
}

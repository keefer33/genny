import { NumberInput, Select, Stack, Switch, Text } from "@mantine/core";
import type {
  SceneTransitionToNext,
  TransitionPresentationType,
  TransitionSound,
} from "~/pages/storyboards/sceneTransitionTypes";
import {
  CARDINAL_DIRECTION_OPTIONS,
  TRANSITION_PRESENTATION_OPTIONS,
  WIPE_DIRECTION_OPTIONS,
  presentationUsesDirection,
  transitionOverlapFrames,
} from "~/pages/storyboards/sceneTransitionTypes";
import {
  DEFAULT_TRANSITION_SOUND_EFFECT,
  TRANSITION_SOUND_EFFECTS,
  type TransitionSoundEffectId,
} from "~/pages/storyboards/transitionSoundEffects";

const SOUND_EFFECT_OPTIONS = TRANSITION_SOUND_EFFECTS.map((effect) => ({
  value: effect.id,
  label: effect.label,
}));

type SceneTransitionSectionProps = {
  transition: SceneTransitionToNext;
  sceneDuration: number;
  nextSceneDuration: number;
  disabled?: boolean;
  onChange: (transition: SceneTransitionToNext) => void;
  inModal?: boolean;
};

function defaultSound(): TransitionSound {
  return { enabled: false, effect: DEFAULT_TRANSITION_SOUND_EFFECT, volume: 1 };
}

export function SceneTransitionSection({
  transition,
  sceneDuration,
  nextSceneDuration,
  disabled,
  onChange,
  inModal = false,
}: SceneTransitionSectionProps) {
  const maxDuration = Math.max(1, Math.min(sceneDuration, nextSceneDuration));
  const overlap = transitionOverlapFrames(transition, sceneDuration, nextSceneDuration);
  const directionMode = presentationUsesDirection(transition.presentation);
  const sound = transition.sound ?? defaultSound();

  const update = (patch: Partial<SceneTransitionToNext>) => {
    onChange({
      ...transition,
      ...patch,
    });
  };

  const updateSound = (patch: Partial<TransitionSound>) => {
    update({
      sound: {
        ...sound,
        ...patch,
      },
    });
  };

  return (
    <Stack
      gap="xs"
      pl={inModal ? 0 : "sm"}
      pr={inModal ? 0 : "xs"}
      pb={inModal ? 0 : "sm"}
      pt={inModal ? 0 : 4}
    >
      {inModal ? null : (
        <Text size="xs" fw={600} c="dimmed" tt="uppercase">
          Transition to next scene
        </Text>
      )}
      <Switch
        label="Enable transition"
        size="xs"
        checked={transition.enabled}
        disabled={disabled}
        onChange={(event) => update({ enabled: event.currentTarget.checked })}
      />
      {transition.enabled ? (
        <Stack gap="xs">
          <Select
            label="Type"
            size="xs"
            data={TRANSITION_PRESENTATION_OPTIONS}
            value={transition.presentation}
            disabled={disabled}
            onChange={(value) => {
              if (!value) return;
              update({ presentation: value as TransitionPresentationType });
            }}
          />
          {directionMode === "cardinal" ? (
            <Select
              label="Direction"
              size="xs"
              data={CARDINAL_DIRECTION_OPTIONS}
              value={transition.slideDirection}
              disabled={disabled}
              onChange={(value) => {
                if (!value) return;
                update({ slideDirection: value as SceneTransitionToNext["slideDirection"] });
              }}
            />
          ) : null}
          {directionMode === "wipe" ? (
            <Select
              label="Direction"
              size="xs"
              data={WIPE_DIRECTION_OPTIONS}
              value={transition.slideDirection}
              disabled={disabled}
              onChange={(value) => {
                if (!value) return;
                update({ slideDirection: value as SceneTransitionToNext["slideDirection"] });
              }}
            />
          ) : null}
          <NumberInput
            label="Duration (frames)"
            size="xs"
            min={1}
            max={maxDuration}
            value={transition.durationInFrames}
            disabled={disabled}
            onChange={(value) => {
              const n = typeof value === "number" ? value : Number(value);
              if (!Number.isFinite(n)) return;
              update({ durationInFrames: Math.min(maxDuration, Math.max(1, Math.round(n))) });
            }}
          />
          <Switch
            label="Play sound effect"
            size="xs"
            checked={sound.enabled}
            disabled={disabled}
            onChange={(event) => updateSound({ enabled: event.currentTarget.checked })}
          />
          {sound.enabled ? (
            <>
              <Select
                label="Sound effect"
                size="xs"
                searchable
                data={SOUND_EFFECT_OPTIONS}
                value={sound.effect}
                disabled={disabled}
                onChange={(value) => {
                  if (!value) return;
                  updateSound({ effect: value as TransitionSoundEffectId });
                }}
              />
              <NumberInput
                label="Sound volume"
                size="xs"
                min={0}
                max={1}
                step={0.05}
                decimalScale={2}
                value={sound.volume}
                disabled={disabled}
                onChange={(value) => {
                  const n = typeof value === "number" ? value : Number(value);
                  if (!Number.isFinite(n)) return;
                  updateSound({ volume: Math.min(1, Math.max(0, n)) });
                }}
              />
            </>
          ) : null}
          <Text size="xs" c="dimmed">
            Overlap: {overlap} frame{overlap === 1 ? "" : "s"} (max {maxDuration})
          </Text>
        </Stack>
      ) : null}
    </Stack>
  );
}

import {
  Button,
  ColorInput,
  Group,
  Input,
  Loader,
  NumberInput,
  SegmentedControl,
  Stack,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useCallback, useEffect, useRef, useState } from "react";
import { getVideoDurationInFrames } from "~/lib/mediaMetadata";
import useStoryboardsStore from "~/lib/stores/storyboardsStore";
import { SceneBackgroundMediaField } from "~/pages/storyboards/components/SceneBackgroundMediaField";
import { VideoPlaybackOptionsFields } from "~/pages/storyboards/components/VideoPlaybackOptionsFields";
import {
  DEFAULT_SCENE_BACKGROUND_COLOR,
  DEFAULT_STORYBOARD_FPS,
  emptySceneFormValues,
  parseStoryboardSettings,
  regularStoryboardScenes,
  sceneFormFromRow,
  parseSceneDurationInFrames,
  type SceneBackgroundType,
  type StoryboardSceneFormValues,
  type UserStoryboardScene,
} from "~/pages/storyboards/storyboardUtils";

const BACKGROUND_TYPE_OPTIONS = [
  { label: "Video", value: "video" },
  { label: "Image", value: "image" },
  { label: "Color", value: "color" },
] as const;

const AUTOSAVE_MS = 400;

function backgroundValueLabel(type: SceneBackgroundType): string {
  if (type === "video") return "Background video";
  if (type === "image") return "Background image";
  return "Background color";
}

function sceneFormSignature(values: StoryboardSceneFormValues): string {
  return JSON.stringify(values);
}

function isSceneFormValid(values: StoryboardSceneFormValues): boolean {
  if (!Number.isFinite(values.durationInFrames) || values.durationInFrames < 1) return false;
  if (!values.backgroundValue.trim()) return false;
  return true;
}

type StoryboardSceneUpsertFormProps = {
  storyboardId: string;
  mode: "create" | "edit";
  active: boolean;
  scene?: UserStoryboardScene | null;
  onCancel?: () => void;
  onCreated?: (sceneId: string) => void;
  onDeleted?: () => void;
};

export function StoryboardSceneUpsertForm({
  storyboardId,
  mode,
  active,
  scene = null,
  onCancel,
  onCreated,
  onDeleted,
}: StoryboardSceneUpsertFormProps) {
  const isEdit = mode === "edit";
  const storyboardScenes = useStoryboardsStore((s) => s.storyboardScenes);
  const selectedStoryboard = useStoryboardsStore((s) => s.selectedStoryboard);
  const createSceneLoading = useStoryboardsStore((s) => s.createSceneLoading);
  const updateSceneLoading = useStoryboardsStore((s) => s.updateSceneLoading);
  const createStoryboardScene = useStoryboardsStore((s) => s.createStoryboardScene);
  const updateStoryboardScene = useStoryboardsStore((s) => s.updateStoryboardScene);
  const deleteStoryboardScene = useStoryboardsStore((s) => s.deleteStoryboardScene);
  const deletingSceneId = useStoryboardsStore((s) => s.deletingSceneId);
  const openTransitionModal = useStoryboardsStore((s) => s.openTransitionModal);
  const setSelectedSceneId = useStoryboardsStore((s) => s.setSelectedSceneId);

  const sceneCount = storyboardScenes.length;
  const storyboardFps =
    parseStoryboardSettings(selectedStoryboard?.settings).fps ?? DEFAULT_STORYBOARD_FPS;
  const submitting = isEdit ? updateSceneLoading : createSceneLoading;
  const [durationLoading, setDurationLoading] = useState(false);
  const durationRequestRef = useRef(0);
  const skipAutosaveRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);
  const lastSavedRef = useRef("");
  const pendingValuesRef = useRef<StoryboardSceneFormValues | null>(null);
  const existingSceneRef = useRef(scene?.scene);

  existingSceneRef.current = scene?.scene;

  const form = useForm<StoryboardSceneFormValues>({
    initialValues: emptySceneFormValues(sceneCount),
    validate: {
      durationInFrames: (value) => {
        if (!Number.isFinite(value) || value < 1) {
          return "Duration must be at least 1 frame";
        }
        return null;
      },
      backgroundValue: (value, values) => {
        if (!value.trim()) {
          return `${backgroundValueLabel(values.backgroundType)} is required`;
        }
        return null;
      },
    },
  });

  const clearSaveTimer = () => {
    if (saveTimerRef.current != null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  };

  const persistScene = useCallback(
    (values: StoryboardSceneFormValues) => {
      if (!isEdit || !scene?.id) return;
      const signature = sceneFormSignature(values);
      if (signature === lastSavedRef.current) return;

      pendingValuesRef.current = values;
      clearSaveTimer();
      saveTimerRef.current = window.setTimeout(() => {
        saveTimerRef.current = null;
        pendingValuesRef.current = null;
        lastSavedRef.current = signature;
        void updateStoryboardScene(storyboardId, scene.id, values, existingSceneRef.current, {
          silent: true,
        });
      }, AUTOSAVE_MS);
    },
    [isEdit, scene?.id, storyboardId, updateStoryboardScene]
  );

  useEffect(() => {
    if (!active) return;
    skipAutosaveRef.current = true;
    clearSaveTimer();
    pendingValuesRef.current = null;

    const nextValues = scene ? sceneFormFromRow(scene) : emptySceneFormValues(sceneCount);
    lastSavedRef.current = scene ? sceneFormSignature(nextValues) : "";
    form.setValues(nextValues);
    form.resetDirty();
    queueMicrotask(() => {
      skipAutosaveRef.current = false;
    });
    // Rehydrate on open / scene switch only — not on every server echo after autosave.
  }, [active, scene?.id, mode, sceneCount]);

  useEffect(() => {
    if (!active || !isEdit || !scene?.id || skipAutosaveRef.current) return;
    if (!isSceneFormValid(form.values)) return;
    persistScene(form.values);
  }, [active, isEdit, scene?.id, form.values, persistScene]);

  useEffect(() => {
    if (!isEdit || !scene?.id) return;
    return () => {
      clearSaveTimer();
      const pending = pendingValuesRef.current;
      if (!pending) return;
      lastSavedRef.current = sceneFormSignature(pending);
      void updateStoryboardScene(storyboardId, scene.id, pending, existingSceneRef.current, {
        silent: true,
      });
      pendingValuesRef.current = null;
    };
  }, [isEdit, scene?.id, storyboardId, updateStoryboardScene]);

  const syncDurationFromVideo = useCallback(
    async (url: string) => {
      const trimmed = url.trim();
      if (!trimmed) return;

      const requestId = ++durationRequestRef.current;
      setDurationLoading(true);
      try {
        const frames = await getVideoDurationInFrames(trimmed, storyboardFps);
        if (requestId !== durationRequestRef.current) return;
        form.setFieldValue("durationInFrames", frames);
      } finally {
        if (requestId === durationRequestRef.current) {
          setDurationLoading(false);
        }
      }
    },
    [form, storyboardFps]
  );

  const handleBackgroundTypeChange = (value: string) => {
    const type = value as SceneBackgroundType;
    form.setFieldValue("backgroundType", type);
    form.setFieldValue("backgroundValue", type === "color" ? DEFAULT_SCENE_BACKGROUND_COLOR : "");
    if (type !== "video") {
      durationRequestRef.current += 1;
      setDurationLoading(false);
    }
  };

  const handleVideoUrlChange = (url: string) => {
    form.setFieldValue("backgroundValue", url);
    void syncDurationFromVideo(url);
  };

  const handleSubmit = form.onSubmit(async (values) => {
    if (isEdit) return;

    const created = await createStoryboardScene(storyboardId, values);
    if (created?.id) {
      setSelectedSceneId(created.id);
      onCreated?.(created.id);
    }
  });

  const handleDelete = async () => {
    if (!isEdit || !scene?.id) return;
    clearSaveTimer();
    pendingValuesRef.current = null;
    const ok = await deleteStoryboardScene(storyboardId, scene.id);
    if (ok) onDeleted?.();
  };

  const backgroundType = form.values.backgroundType;
  const nextScene =
    isEdit && scene
      ? regularStoryboardScenes(storyboardScenes).find(
          (_row, index, rows) => rows[index - 1]?.id === scene.id
        )
      : undefined;

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <Title order={5}>{isEdit ? "Edit scene" : "Add scene"}</Title>
        <TextInput
          label="Title"
          disabled={!isEdit && submitting}
          {...form.getInputProps("title")}
        />
        <SegmentedControl
          fullWidth
          data={[...BACKGROUND_TYPE_OPTIONS]}
          value={backgroundType}
          onChange={handleBackgroundTypeChange}
          disabled={!isEdit && submitting}
        />
        {backgroundType === "video" ? (
          <Stack gap="sm">
            <SceneBackgroundMediaField
              label="video"
              allowedTypes="videos"
              value={form.values.backgroundValue}
              onChange={handleVideoUrlChange}
            />
            <VideoPlaybackOptionsFields
              disabled={!isEdit && submitting}
              values={{
                trimBefore: form.values.backgroundVideoTrimBefore,
                trimAfter: form.values.backgroundVideoTrimAfter,
                volume: form.values.backgroundVideoVolume,
                playbackRate: form.values.backgroundVideoPlaybackRate,
              }}
              onChange={(patch) => {
                if (patch.trimBefore !== undefined) {
                  form.setFieldValue("backgroundVideoTrimBefore", patch.trimBefore);
                }
                if (patch.trimAfter !== undefined) {
                  form.setFieldValue("backgroundVideoTrimAfter", patch.trimAfter);
                }
                if (patch.volume !== undefined) {
                  form.setFieldValue("backgroundVideoVolume", patch.volume);
                }
                if (patch.playbackRate !== undefined) {
                  form.setFieldValue("backgroundVideoPlaybackRate", patch.playbackRate);
                }
              }}
            />
          </Stack>
        ) : null}
        {backgroundType === "image" ? (
          <SceneBackgroundMediaField
            label="image"
            allowedTypes="images"
            value={form.values.backgroundValue}
            onChange={(url) => form.setFieldValue("backgroundValue", url)}
          />
        ) : null}
        {backgroundType === "color" ? (
          <ColorInput
            label="Background color"
            format="hex"
            disabled={!isEdit && submitting}
            {...form.getInputProps("backgroundValue")}
          />
        ) : null}
        {form.errors.backgroundValue ? (
          <Input.Error>{form.errors.backgroundValue}</Input.Error>
        ) : null}
        <NumberInput
          label="Duration (frames)"
          description={
            backgroundType === "video"
              ? "Auto-set from video duration when a video is selected"
              : undefined
          }
          min={1}
          disabled={(!isEdit && submitting) || (backgroundType === "video" && durationLoading)}
          rightSection={durationLoading ? <Loader size="xs" /> : undefined}
          {...form.getInputProps("durationInFrames")}
        />
        {isEdit && scene && nextScene ? (
          <Button
            type="button"
            variant="light"
            onClick={() =>
              openTransitionModal(
                storyboardId,
                scene,
                parseSceneDurationInFrames(scene.scene),
                parseSceneDurationInFrames(nextScene.scene)
              )
            }
          >
            Edit transition to next scene
          </Button>
        ) : null}
        <Group justify="space-between" gap="xs">
          {isEdit ? (
            <Button
              type="button"
              variant="light"
              color="red"
              disabled={deletingSceneId === scene?.id}
              loading={deletingSceneId === scene?.id}
              onClick={() => void handleDelete()}
            >
              Delete scene
            </Button>
          ) : (
            <span />
          )}
          <Group gap="xs" justify="flex-end">
            {onCancel ? (
              <Button
                variant="default"
                onClick={onCancel}
                disabled={!isEdit && submitting}
                type="button"
              >
                {isEdit ? "Close" : "Cancel"}
              </Button>
            ) : null}
            {!isEdit ? (
              <Button type="submit" loading={submitting}>
                Add scene
              </Button>
            ) : null}
          </Group>
        </Group>
      </Stack>
    </form>
  );
}

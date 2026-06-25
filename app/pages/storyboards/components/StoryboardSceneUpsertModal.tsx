import {
  Button,
  ColorInput,
  Group,
  Input,
  Loader,
  Modal,
  NumberInput,
  SegmentedControl,
  Stack,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useCallback, useEffect, useRef, useState } from "react";
import { getVideoDurationInFrames } from "~/lib/mediaMetadata";
import useAppStore from "~/lib/stores/appStore";
import useStoryboardsStore from "~/lib/stores/storyboardsStore";
import { SceneBackgroundMediaField } from "~/pages/storyboards/components/SceneBackgroundMediaField";
import {
  DEFAULT_SCENE_BACKGROUND_COLOR,
  emptySceneFormValues,
  sceneFormFromRow,
  type SceneBackgroundType,
  type StoryboardSceneFormValues,
  type UserStoryboardScene,
} from "~/pages/storyboards/storyboardUtils";

type StoryboardSceneUpsertModalProps = {
  opened: boolean;
  onClose: () => void;
  storyboardId: string;
  sceneCount: number;
  storyboardFps: number;
  scene?: UserStoryboardScene | null;
};

const BACKGROUND_TYPE_OPTIONS = [
  { label: "Video", value: "video" },
  { label: "Image", value: "image" },
  { label: "Color", value: "color" },
] as const;

function backgroundValueLabel(type: SceneBackgroundType): string {
  if (type === "video") return "Background video";
  if (type === "image") return "Background image";
  return "Background color";
}

export function StoryboardSceneUpsertModal({
  opened,
  onClose,
  storyboardId,
  sceneCount,
  storyboardFps,
  scene = null,
}: StoryboardSceneUpsertModalProps) {
  const isMobile = useAppStore((s) => s.isMobile);
  const isEdit = Boolean(scene?.id);
  const createSceneLoading = useStoryboardsStore((s) => s.createSceneLoading);
  const updateSceneLoading = useStoryboardsStore((s) => s.updateSceneLoading);
  const createStoryboardScene = useStoryboardsStore((s) => s.createStoryboardScene);
  const updateStoryboardScene = useStoryboardsStore((s) => s.updateStoryboardScene);
  const submitting = isEdit ? updateSceneLoading : createSceneLoading;
  const [durationLoading, setDurationLoading] = useState(false);
  const durationRequestRef = useRef(0);

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

  useEffect(() => {
    if (!opened) return;
    form.setValues(scene ? sceneFormFromRow(scene) : emptySceneFormValues(sceneCount));
    form.resetDirty();
  }, [opened, scene, sceneCount]);

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

  const handleClose = () => {
    if (submitting) return;
    onClose();
    form.reset();
  };

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
    if (isEdit && scene?.id) {
      const ok = await updateStoryboardScene(storyboardId, scene.id, values, scene.scene);
      if (ok) handleClose();
      return;
    }

    const created = await createStoryboardScene(storyboardId, values);
    if (created?.id) handleClose();
  });

  const backgroundType = form.values.backgroundType;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={isEdit ? "Edit scene" : "Add scene"}
      centered
      size={isMobile ? "100%" : "md"}
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput label="Title" disabled={submitting} {...form.getInputProps("title")} />
          <SegmentedControl
            fullWidth
            data={[...BACKGROUND_TYPE_OPTIONS]}
            value={backgroundType}
            onChange={handleBackgroundTypeChange}
            disabled={submitting}
          />
          {backgroundType === "video" ? (
            <SceneBackgroundMediaField
              label="video"
              allowedTypes="videos"
              value={form.values.backgroundValue}
              onChange={handleVideoUrlChange}
            />
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
              disabled={submitting}
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
            disabled={submitting || (backgroundType === "video" && durationLoading)}
            rightSection={durationLoading ? <Loader size="xs" /> : undefined}
            {...form.getInputProps("durationInFrames")}
          />
          <Group justify="flex-end" gap="xs">
            <Button variant="default" onClick={handleClose} disabled={submitting} type="button">
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {isEdit ? "Save changes" : "Add scene"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

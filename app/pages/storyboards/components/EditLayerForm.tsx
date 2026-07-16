import {
  Button,
  ColorInput,
  Group,
  NumberInput,
  Select,
  Stack,
  Switch,
  Textarea,
  TextInput,
  Card,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useEffect, type FormEvent } from "react";
import useStoryboardsStore from "~/lib/stores/storyboardsStore";
import { GoogleFontPicker } from "~/pages/storyboards/components/GoogleFontPicker";
import { SceneBackgroundMediaField } from "~/pages/storyboards/components/SceneBackgroundMediaField";
import { VideoPlaybackOptionsFields } from "~/pages/storyboards/components/VideoPlaybackOptionsFields";
import {
  layerEditFormFromLayer,
  layerFromEditForm,
  type LayerContentType,
  type LayerEditFormValues,
} from "~/pages/storyboards/layerContentTypes";
import {
  isBaseStoryboardScene,
  parseSceneDurationInFrames,
  totalStoryboardDurationInFrames,
} from "~/pages/storyboards/storyboardUtils";

const CONTENT_TYPE_OPTIONS = [
  { value: "video", label: "Video" },
  { value: "image", label: "Image" },
  { value: "audio", label: "Audio" },
  { value: "text", label: "Text" },
  { value: "animatedText", label: "Animated text" },
] as const;

const ANIMATED_TEXT_SPLIT_OPTIONS = [
  { value: "none", label: "None" },
  { value: "word", label: "Word" },
  { value: "character", label: "Character" },
  { value: "line", label: "Line" },
] as const;

function parseFrameInput(value: number | string): number | null {
  if (value === "" || value === "-") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.round(parsed);
}

function clampFrameRange(from: number, to: number, maxFrame: number): { from: number; to: number } {
  const clampedFrom = Math.min(Math.max(0, from), maxFrame);
  const clampedTo = Math.min(Math.max(clampedFrom, to), maxFrame);
  return { from: clampedFrom, to: clampedTo };
}

type EditLayerFormProps = {
  storyboardId: string;
  layerId: string;
  active: boolean;
  onDeselect?: () => void;
};

export function EditLayerForm({ storyboardId, layerId, active, onDeselect }: EditLayerFormProps) {
  const layerItems = useStoryboardsStore((s) => s.layerItems);
  const selectedSceneId = useStoryboardsStore((s) => s.selectedSceneId);
  const storyboardScenes = useStoryboardsStore((s) => s.storyboardScenes);
  const saveLayersLoading = useStoryboardsStore((s) => s.saveLayersLoading);
  const deleteStoryboardLayer = useStoryboardsStore((s) => s.deleteStoryboardLayer);
  const saveEditingLayer = useStoryboardsStore((s) => s.saveEditingLayer);

  const layer = layerItems.find((row) => row.id === layerId) ?? null;
  const selectedScene = storyboardScenes.find((scene) => scene.id === selectedSceneId);
  const isBaseLayer = Boolean(selectedScene && isBaseStoryboardScene(selectedScene));
  const sceneDurationInFrames = isBaseLayer
    ? totalStoryboardDurationInFrames(storyboardScenes)
    : parseSceneDurationInFrames(selectedScene?.scene);
  const maxFrame = Math.max(0, sceneDurationInFrames - 1);

  const form = useForm<LayerEditFormValues & { transparentBackground: boolean }>({
    initialValues: {
      ...layerEditFormFromLayer(
        layer ?? {
          id: "",
          title: "Layer 1",
          durationInFrames: sceneDurationInFrames,
          from: 0,
          left: 0,
          top: 0,
          width: 360,
          height: 360,
          color: "transparent",
        }
      ),
      transparentBackground: true,
    },
    validate: {
      title: (value) => (value.trim() ? null : "Title is required"),
      from: (value) => {
        if (!Number.isFinite(value) || value < 0 || value > maxFrame) {
          return `From must be between 0 and ${maxFrame}`;
        }
        return null;
      },
      to: (value, values) => {
        if (!Number.isFinite(value) || value < 0 || value > maxFrame) {
          return `To must be between 0 and ${maxFrame}`;
        }
        if (value < values.from) {
          return "To must be greater than or equal to from";
        }
        return null;
      },
    },
  });

  useEffect(() => {
    if (!active || !layerId) return;
    const currentLayer = useStoryboardsStore.getState().layerItems.find((row) => row.id === layerId);
    if (!currentLayer) return;
    const values = layerEditFormFromLayer(currentLayer);
    const { from, to } = clampFrameRange(values.from, values.to, maxFrame);
    form.setValues({
      ...values,
      from,
      to,
      transparentBackground: currentLayer.color === "transparent",
    });
    form.resetDirty();
  }, [active, layerId, maxFrame]);

  const syncFrameRange = () => {
    const { from, to } = form.getValues();
    form.setValues({ ...form.getValues(), ...clampFrameRange(from, to, maxFrame) });
  };

  const submitLayer = async (values: LayerEditFormValues & { transparentBackground: boolean }) => {
    if (!layer) return;
    const nextLayer = layerFromEditForm(layer, {
      ...values,
      color: values.transparentBackground ? "transparent" : values.color,
    });
    await saveEditingLayer(storyboardId, nextLayer);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    syncFrameRange();
    form.onSubmit(submitLayer)(event);
  };

  const contentType = form.values.contentType;

  const handleContentTypeChange = (value: string | null) => {
    if (!value) return;
    form.setFieldValue("contentType", value as LayerContentType);
  };

  const handleTransparentChange = (checked: boolean) => {
    form.setFieldValue("transparentBackground", checked);
    if (!checked && form.values.color === "transparent") {
      form.setFieldValue("color", "#ffffff");
    }
  };

  const handleFromChange = (value: number | string) => {
    const nextFrom = parseFrameInput(value);
    if (nextFrom === null) return;
    form.setFieldValue("from", Math.min(Math.max(0, nextFrom), maxFrame));
  };

  const handleToChange = (value: number | string) => {
    const nextTo = parseFrameInput(value);
    if (nextTo === null) return;
    form.setFieldValue("to", Math.min(Math.max(0, nextTo), maxFrame));
  };

  const handleDelete = async () => {
    if (!selectedSceneId || saveLayersLoading) return;
    await deleteStoryboardLayer(storyboardId, selectedSceneId, layerId);
    onDeselect?.();
  };

  if (!layer) return null;

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="xl">
        <Title order={5}>Edit layer</Title>
        <TextInput label="Title" disabled={saveLayersLoading} {...form.getInputProps("title")} />
          <Switch
            label="Transparent background"
            checked={form.values.transparentBackground}
            onChange={(event) => handleTransparentChange(event.currentTarget.checked)}
            disabled={saveLayersLoading}
          />
          {!form.values.transparentBackground ? (
            <ColorInput
              label="Layer background color"
              format="hex"
              disabled={saveLayersLoading}
              {...form.getInputProps("color")}
            />
          ) : null}

          <Group grow align="flex-start">
            <NumberInput
              label="From (frame)"
              min={0}
              max={maxFrame}
              clampBehavior="blur"
              disabled={saveLayersLoading}
              value={form.values.from}
              onChange={handleFromChange}
              onBlur={syncFrameRange}
              error={form.errors.from}
            />
            <NumberInput
              label="To (frame)"
              min={0}
              max={maxFrame}
              clampBehavior="blur"
              disabled={saveLayersLoading}
              value={form.values.to}
              onChange={handleToChange}
              onBlur={syncFrameRange}
              error={form.errors.to}
            />
          </Group>

          <Select
            label="Select content type"
            data={[...CONTENT_TYPE_OPTIONS]}
            value={contentType}
            onChange={handleContentTypeChange}
            disabled={saveLayersLoading}
          />
          <Card>
            {contentType === "video" ? (
              <Stack gap="sm">
                <Title order={5}>Video</Title>
                <SceneBackgroundMediaField
                  label="video"
                  allowedTypes="videos"
                  value={form.values.videoUrl}
                  onChange={(url) => form.setFieldValue("videoUrl", url)}
                />
                <VideoPlaybackOptionsFields
                  disabled={saveLayersLoading}
                  values={{
                    trimBefore: form.values.videoTrimBefore,
                    trimAfter: form.values.videoTrimAfter,
                    volume: form.values.videoVolume,
                    playbackRate: form.values.videoPlaybackRate,
                  }}
                  onChange={(patch) => {
                    if (patch.trimBefore !== undefined) {
                      form.setFieldValue("videoTrimBefore", patch.trimBefore);
                    }
                    if (patch.trimAfter !== undefined) {
                      form.setFieldValue("videoTrimAfter", patch.trimAfter);
                    }
                    if (patch.volume !== undefined) {
                      form.setFieldValue("videoVolume", patch.volume);
                    }
                    if (patch.playbackRate !== undefined) {
                      form.setFieldValue("videoPlaybackRate", patch.playbackRate);
                    }
                  }}
                />
              </Stack>
            ) : null}

            {contentType === "image" ? (
              <SceneBackgroundMediaField
                label="image"
                allowedTypes="images"
                value={form.values.imageUrl}
                onChange={(url) => form.setFieldValue("imageUrl", url)}
              />
            ) : null}

            {contentType === "audio" ? (
              <Stack gap="sm">
                <Title order={5}>Audio</Title>
                <SceneBackgroundMediaField
                  label="audio"
                  allowedTypes="audio"
                  value={form.values.audioUrl}
                  onChange={(url) => form.setFieldValue("audioUrl", url)}
                />
                <VideoPlaybackOptionsFields
                  disabled={saveLayersLoading}
                  values={{
                    trimBefore: form.values.audioTrimBefore,
                    trimAfter: form.values.audioTrimAfter,
                    volume: form.values.audioVolume,
                    playbackRate: form.values.audioPlaybackRate,
                  }}
                  onChange={(patch) => {
                    if (patch.trimBefore !== undefined) {
                      form.setFieldValue("audioTrimBefore", patch.trimBefore);
                    }
                    if (patch.trimAfter !== undefined) {
                      form.setFieldValue("audioTrimAfter", patch.trimAfter);
                    }
                    if (patch.volume !== undefined) {
                      form.setFieldValue("audioVolume", patch.volume);
                    }
                    if (patch.playbackRate !== undefined) {
                      form.setFieldValue("audioPlaybackRate", patch.playbackRate);
                    }
                  }}
                />
              </Stack>
            ) : null}

            {contentType === "text" ? (
              <Stack gap="sm">
                <Textarea
                  label="Text"
                  minRows={2}
                  disabled={saveLayersLoading}
                  {...form.getInputProps("text")}
                />
                <NumberInput
                  label="Font size"
                  min={8}
                  max={400}
                  disabled={saveLayersLoading}
                  {...form.getInputProps("textFontSize")}
                />
                <ColorInput
                  label="Text color"
                  format="hex"
                  disabled={saveLayersLoading}
                  {...form.getInputProps("textColor")}
                />
                <GoogleFontPicker
                  value={form.values.textFontImportName}
                  disabled={saveLayersLoading}
                  onChange={(importName, fontFamily) => {
                    form.setFieldValue("textFontImportName", importName);
                    form.setFieldValue("textFontFamily", fontFamily);
                  }}
                />
                <Switch
                  label="Bold"
                  checked={form.values.textBold}
                  onChange={(event) => form.setFieldValue("textBold", event.currentTarget.checked)}
                  disabled={saveLayersLoading}
                />
              </Stack>
            ) : null}

            {contentType === "animatedText" ? (
              <Stack gap="sm">
                <Textarea
                  label="Text"
                  minRows={2}
                  disabled={saveLayersLoading}
                  {...form.getInputProps("text")}
                />
                <NumberInput
                  label="Font size"
                  min={8}
                  max={400}
                  disabled={saveLayersLoading}
                  {...form.getInputProps("textFontSize")}
                />
                <ColorInput
                  label="Text color"
                  format="hex"
                  disabled={saveLayersLoading}
                  {...form.getInputProps("textColor")}
                />
                <GoogleFontPicker
                  value={form.values.textFontImportName}
                  disabled={saveLayersLoading}
                  onChange={(importName, fontFamily) => {
                    form.setFieldValue("textFontImportName", importName);
                    form.setFieldValue("textFontFamily", fontFamily);
                  }}
                />
                <Switch
                  label="Bold"
                  checked={form.values.textBold}
                  onChange={(event) => form.setFieldValue("textBold", event.currentTarget.checked)}
                  disabled={saveLayersLoading}
                />
                <Select
                  label="Split by"
                  description="How the text is divided for staggered animation"
                  data={[...ANIMATED_TEXT_SPLIT_OPTIONS]}
                  disabled={saveLayersLoading}
                  {...form.getInputProps("animatedTextSplit")}
                />
                <Group grow align="flex-start">
                  <NumberInput
                    label="Duration (frames)"
                    min={1}
                    disabled={saveLayersLoading}
                    {...form.getInputProps("animatedTextDuration")}
                  />
                  <NumberInput
                    label="Stagger (frames)"
                    min={0}
                    disabled={saveLayersLoading}
                    {...form.getInputProps("animatedTextStagger")}
                  />
                </Group>
                <Group grow align="flex-start">
                  <NumberInput
                    label="Opacity start"
                    min={0}
                    max={1}
                    step={0.1}
                    decimalScale={2}
                    disabled={saveLayersLoading}
                    {...form.getInputProps("animatedTextOpacityFrom")}
                  />
                  <NumberInput
                    label="Opacity end"
                    min={0}
                    max={1}
                    step={0.1}
                    decimalScale={2}
                    disabled={saveLayersLoading}
                    {...form.getInputProps("animatedTextOpacityTo")}
                  />
                </Group>
                <Group grow align="flex-start">
                  <NumberInput
                    label="Y start (px)"
                    disabled={saveLayersLoading}
                    {...form.getInputProps("animatedTextYFrom")}
                  />
                  <NumberInput
                    label="Y end (px)"
                    disabled={saveLayersLoading}
                    {...form.getInputProps("animatedTextYTo")}
                  />
                </Group>
              </Stack>
            ) : null}
          </Card>
          <Group justify="space-between" gap="xs">
            <Button
              type="button"
              variant="light"
              color="red"
              disabled={saveLayersLoading}
              onClick={() => void handleDelete()}
            >
              Delete layer
            </Button>
            <Group gap="xs" justify="flex-end">
              {onDeselect ? (
                <Button
                  variant="default"
                  onClick={onDeselect}
                  disabled={saveLayersLoading}
                  type="button"
                >
                  Deselect
                </Button>
              ) : null}
              <Button type="submit" loading={saveLayersLoading}>
                Save layer
              </Button>
            </Group>
          </Group>
        </Stack>
      </form>
  );
}

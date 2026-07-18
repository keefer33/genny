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
import { useCallback, useEffect, useRef } from "react";
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
  createDefaultSceneLayer,
  isBaseStoryboardScene,
  parseSceneDurationInFrames,
  sanitizeLayersForSave,
  totalStoryboardDurationInFrames,
  type SceneLayer,
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

const AUTOSAVE_MS = 400;

type LayerFormValues = LayerEditFormValues & { transparentBackground: boolean };

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

function layerFromFormValues(layer: SceneLayer, values: LayerFormValues): SceneLayer {
  return layerFromEditForm(layer, {
    ...values,
    color: values.transparentBackground ? "transparent" : values.color,
  });
}

function layerSaveSignature(layer: SceneLayer): string {
  return JSON.stringify(sanitizeLayersForSave([layer])[0]);
}

function isLayerFormValid(values: LayerFormValues, maxFrame: number): boolean {
  if (!values.title.trim()) return false;
  if (!Number.isFinite(values.from) || values.from < 0 || values.from > maxFrame) return false;
  if (!Number.isFinite(values.to) || values.to < 0 || values.to > maxFrame) return false;
  if (values.to < values.from) return false;
  return true;
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
  const changeLayer = useStoryboardsStore((s) => s.changeLayer);
  const saveEditingLayer = useStoryboardsStore((s) => s.saveEditingLayer);

  const layer = layerItems.find((row) => row.id === layerId) ?? null;
  const selectedScene = storyboardScenes.find((scene) => scene.id === selectedSceneId);
  const isBaseLayer = Boolean(selectedScene && isBaseStoryboardScene(selectedScene));
  const sceneDurationInFrames = isBaseLayer
    ? totalStoryboardDurationInFrames(storyboardScenes)
    : parseSceneDurationInFrames(selectedScene?.scene);
  const maxFrame = Math.max(0, sceneDurationInFrames - 1);

  const skipAutosaveRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);
  const lastSavedRef = useRef("");
  const pendingLayerRef = useRef<SceneLayer | null>(null);

  const form = useForm<LayerFormValues>({
    initialValues: {
      ...layerEditFormFromLayer(layer ?? createDefaultSceneLayer([], sceneDurationInFrames)),
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

  const clearSaveTimer = () => {
    if (saveTimerRef.current != null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  };

  const persistLayer = useCallback(
    (nextLayer: SceneLayer) => {
      const signature = layerSaveSignature(nextLayer);
      if (signature === lastSavedRef.current) return;

      changeLayer(nextLayer.id, () => nextLayer);
      pendingLayerRef.current = nextLayer;
      clearSaveTimer();

      saveTimerRef.current = window.setTimeout(() => {
        saveTimerRef.current = null;
        pendingLayerRef.current = null;
        lastSavedRef.current = signature;
        void saveEditingLayer(storyboardId, nextLayer, { silent: true });
      }, AUTOSAVE_MS);
    },
    [changeLayer, saveEditingLayer, storyboardId]
  );

  useEffect(() => {
    if (!active || !layerId) return;
    const currentLayer = useStoryboardsStore
      .getState()
      .layerItems.find((row) => row.id === layerId);
    if (!currentLayer) return;

    skipAutosaveRef.current = true;
    clearSaveTimer();
    pendingLayerRef.current = null;
    lastSavedRef.current = layerSaveSignature(currentLayer);

    const values = layerEditFormFromLayer(currentLayer);
    const { from, to } = clampFrameRange(values.from, values.to, maxFrame);
    form.setValues({
      ...values,
      from,
      to,
      transparentBackground: currentLayer.color === "transparent",
    });
    form.resetDirty();
    queueMicrotask(() => {
      skipAutosaveRef.current = false;
    });
  }, [active, layerId, maxFrame]);

  useEffect(() => {
    if (!active || skipAutosaveRef.current) return;
    const currentLayer = useStoryboardsStore
      .getState()
      .layerItems.find((row) => row.id === layerId);
    if (!currentLayer) return;
    if (!isLayerFormValid(form.values, maxFrame)) return;

    const nextLayer = layerFromFormValues(currentLayer, form.values);
    persistLayer(nextLayer);
  }, [active, form.values, layerId, maxFrame, persistLayer]);

  useEffect(() => {
    return () => {
      clearSaveTimer();
      const pending = pendingLayerRef.current;
      if (!pending) return;
      lastSavedRef.current = layerSaveSignature(pending);
      void saveEditingLayer(storyboardId, pending, { silent: true });
      pendingLayerRef.current = null;
    };
  }, [saveEditingLayer, storyboardId, layerId]);

  const syncFrameRange = () => {
    const { from, to } = form.getValues();
    form.setValues({ ...form.getValues(), ...clampFrameRange(from, to, maxFrame) });
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
    clearSaveTimer();
    pendingLayerRef.current = null;
    await deleteStoryboardLayer(storyboardId, selectedSceneId, layerId);
    onDeselect?.();
  };

  if (!layer) return null;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <Stack gap="xl">
        <Title order={5}>Edit layer</Title>
        <TextInput label="Title" {...form.getInputProps("title")} />
        <Switch
          label="Transparent background"
          checked={form.values.transparentBackground}
          onChange={(event) => handleTransparentChange(event.currentTarget.checked)}
        />
        {!form.values.transparentBackground ? (
          <ColorInput
            label="Layer background color"
            format="hex"
            {...form.getInputProps("color")}
          />
        ) : null}

        <NumberInput
          label="Padding"
          min={0}
          max={500}
          clampBehavior="blur"
          {...form.getInputProps("padding")}
        />
        <Switch
          label="Border"
          checked={form.values.border}
          onChange={(event) => form.setFieldValue("border", event.currentTarget.checked)}
        />
        {form.values.border ? (
          <Group grow align="flex-start">
            <NumberInput
              label="Border width"
              min={0}
              max={100}
              clampBehavior="blur"
              {...form.getInputProps("borderWidth")}
            />
            <ColorInput label="Border color" format="hex" {...form.getInputProps("borderColor")} />
          </Group>
        ) : null}
        <NumberInput
          label="Border radius"
          min={0}
          max={999}
          clampBehavior="blur"
          {...form.getInputProps("borderRadius")}
        />
        <Switch
          label="Shadow"
          checked={form.values.shadow}
          onChange={(event) => form.setFieldValue("shadow", event.currentTarget.checked)}
        />
        {form.values.shadow ? (
          <Stack gap="sm">
            <Group grow align="flex-start">
              <NumberInput
                label="Offset X"
                clampBehavior="blur"
                {...form.getInputProps("shadowOffsetX")}
              />
              <NumberInput
                label="Offset Y"
                clampBehavior="blur"
                {...form.getInputProps("shadowOffsetY")}
              />
            </Group>
            <Group grow align="flex-start">
              <NumberInput
                label="Blur"
                min={0}
                max={200}
                clampBehavior="blur"
                {...form.getInputProps("shadowBlur")}
              />
              <NumberInput
                label="Spread"
                clampBehavior="blur"
                {...form.getInputProps("shadowSpread")}
              />
            </Group>
            <ColorInput label="Shadow color" format="hexa" {...form.getInputProps("shadowColor")} />
          </Stack>
        ) : null}

        <Group grow align="flex-start">
          <NumberInput
            label="From (frame)"
            min={0}
            max={maxFrame}
            clampBehavior="blur"
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
              <Textarea label="Text" minRows={2} {...form.getInputProps("text")} />
              <NumberInput
                label="Font size"
                min={8}
                max={400}
                {...form.getInputProps("textFontSize")}
              />
              <ColorInput label="Text color" format="hex" {...form.getInputProps("textColor")} />
              <GoogleFontPicker
                value={form.values.textFontImportName}
                onChange={(importName, fontFamily) => {
                  form.setFieldValue("textFontImportName", importName);
                  form.setFieldValue("textFontFamily", fontFamily);
                }}
              />
              <Switch
                label="Bold"
                checked={form.values.textBold}
                onChange={(event) => form.setFieldValue("textBold", event.currentTarget.checked)}
              />
            </Stack>
          ) : null}

          {contentType === "animatedText" ? (
            <Stack gap="sm">
              <Textarea label="Text" minRows={2} {...form.getInputProps("text")} />
              <NumberInput
                label="Font size"
                min={8}
                max={400}
                {...form.getInputProps("textFontSize")}
              />
              <ColorInput label="Text color" format="hex" {...form.getInputProps("textColor")} />
              <GoogleFontPicker
                value={form.values.textFontImportName}
                onChange={(importName, fontFamily) => {
                  form.setFieldValue("textFontImportName", importName);
                  form.setFieldValue("textFontFamily", fontFamily);
                }}
              />
              <Switch
                label="Bold"
                checked={form.values.textBold}
                onChange={(event) => form.setFieldValue("textBold", event.currentTarget.checked)}
              />
              <Select
                label="Split by"
                description="How the text is divided for staggered animation"
                data={[...ANIMATED_TEXT_SPLIT_OPTIONS]}
                {...form.getInputProps("animatedTextSplit")}
              />
              <Group grow align="flex-start">
                <NumberInput
                  label="Duration (frames)"
                  min={1}
                  {...form.getInputProps("animatedTextDuration")}
                />
                <NumberInput
                  label="Stagger (frames)"
                  min={0}
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
                  {...form.getInputProps("animatedTextOpacityFrom")}
                />
                <NumberInput
                  label="Opacity end"
                  min={0}
                  max={1}
                  step={0.1}
                  decimalScale={2}
                  {...form.getInputProps("animatedTextOpacityTo")}
                />
              </Group>
              <Group grow align="flex-start">
                <NumberInput label="Y start (px)" {...form.getInputProps("animatedTextYFrom")} />
                <NumberInput label="Y end (px)" {...form.getInputProps("animatedTextYTo")} />
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
          {onDeselect ? (
            <Button variant="default" onClick={onDeselect} type="button">
              Deselect
            </Button>
          ) : null}
        </Group>
      </Stack>
    </form>
  );
}

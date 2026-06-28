import {
  Button,
  ColorInput,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Switch,
  Textarea,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useEffect, type FormEvent } from "react";
import useAppStore from "~/lib/stores/appStore";
import useStoryboardsStore from "~/lib/stores/storyboardsStore";
import { GoogleFontPicker } from "~/pages/storyboards/components/GoogleFontPicker";
import { SceneBackgroundMediaField } from "~/pages/storyboards/components/SceneBackgroundMediaField";
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

type EditLayerModalProps = {
  storyboardId: string;
};

export function EditLayerModal({ storyboardId }: EditLayerModalProps) {
  const isMobile = useAppStore((s) => s.isMobile);
  const layerEditorOpened = useStoryboardsStore((s) => s.layerEditorOpened);
  const editingLayerId = useStoryboardsStore((s) => s.editingLayerId);
  const layerItems = useStoryboardsStore((s) => s.layerItems);
  const selectedSceneId = useStoryboardsStore((s) => s.selectedSceneId);
  const storyboardScenes = useStoryboardsStore((s) => s.storyboardScenes);
  const saveLayersLoading = useStoryboardsStore((s) => s.saveLayersLoading);
  const closeLayerEditor = useStoryboardsStore((s) => s.closeLayerEditor);
  const saveEditingLayer = useStoryboardsStore((s) => s.saveEditingLayer);

  const layer = layerItems.find((row) => row.id === editingLayerId) ?? null;
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
    if (!layerEditorOpened || !editingLayerId) return;
    const currentLayer = useStoryboardsStore
      .getState()
      .layerItems.find((row) => row.id === editingLayerId);
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
  }, [layerEditorOpened, editingLayerId, maxFrame]);

  const handleClose = () => {
    if (saveLayersLoading) return;
    closeLayerEditor();
  };

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
    closeLayerEditor();
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

  return (
    <Modal
      opened={layerEditorOpened && Boolean(layer)}
      onClose={handleClose}
      title="Edit layer"
      centered
      size={isMobile ? "100%" : "md"}
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
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
            label="Content"
            data={[...CONTENT_TYPE_OPTIONS]}
            value={contentType}
            onChange={handleContentTypeChange}
            disabled={saveLayersLoading}
          />

          {contentType === "video" ? (
            <SceneBackgroundMediaField
              label="video"
              allowedTypes="videos"
              value={form.values.videoUrl}
              onChange={(url) => form.setFieldValue("videoUrl", url)}
            />
          ) : null}

          {contentType === "image" ? (
            <SceneBackgroundMediaField
              label="image"
              allowedTypes="images"
              value={form.values.imageUrl}
              onChange={(url) => form.setFieldValue("imageUrl", url)}
            />
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

          <Group justify="flex-end" gap="xs">
            <Button
              variant="default"
              onClick={handleClose}
              disabled={saveLayersLoading}
              type="button"
            >
              Cancel
            </Button>
            <Button type="submit" loading={saveLayersLoading}>
              Save layer
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

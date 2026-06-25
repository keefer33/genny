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
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useEffect } from "react";
import useAppStore from "~/lib/stores/appStore";
import { GoogleFontPicker } from "~/pages/storyboards/components/GoogleFontPicker";
import { SceneBackgroundMediaField } from "~/pages/storyboards/components/SceneBackgroundMediaField";
import {
  layerEditFormFromLayer,
  layerFromEditForm,
  type LayerContentType,
  type LayerEditFormValues,
} from "~/pages/storyboards/layerContentTypes";
import type { SceneLayer } from "~/pages/storyboards/storyboardUtils";

type EditLayerModalProps = {
  opened: boolean;
  onClose: () => void;
  layer: SceneLayer | null;
  sceneDurationInFrames: number;
  submitting?: boolean;
  onSave: (layer: SceneLayer) => void | Promise<void>;
};

const CONTENT_TYPE_OPTIONS = [
  { value: "video", label: "Video" },
  { value: "image", label: "Image" },
  { value: "text", label: "Text" },
] as const;

export function EditLayerModal({
  opened,
  onClose,
  layer,
  sceneDurationInFrames,
  submitting = false,
  onSave,
}: EditLayerModalProps) {
  const isMobile = useAppStore((s) => s.isMobile);
  const maxFrame = Math.max(0, sceneDurationInFrames - 1);

  const form = useForm<LayerEditFormValues & { transparentBackground: boolean }>({
    initialValues: {
      ...layerEditFormFromLayer(
        layer ?? {
          id: "",
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
    if (!opened || !layer) return;
    const values = layerEditFormFromLayer(layer);
    const from = Math.min(Math.max(0, values.from), maxFrame);
    const to = Math.min(Math.max(from, values.to), maxFrame);
    form.setValues({
      ...values,
      from,
      to,
      transparentBackground: layer.color === "transparent",
    });
    form.resetDirty();
  }, [opened, layer, maxFrame]);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSubmit = form.onSubmit(async (values) => {
    if (!layer) return;
    const nextLayer = layerFromEditForm(layer, {
      ...values,
      color: values.transparentBackground ? "transparent" : values.color,
    });
    await onSave(nextLayer);
    handleClose();
  });

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
    const nextFrom = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(nextFrom)) return;
    const from = Math.min(Math.max(0, Math.round(nextFrom)), maxFrame);
    form.setFieldValue("from", from);
    if (form.values.to < from) {
      form.setFieldValue("to", from);
    }
  };

  const handleToChange = (value: number | string) => {
    const nextTo = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(nextTo)) return;
    const to = Math.min(Math.max(0, Math.round(nextTo)), maxFrame);
    form.setFieldValue("to", to);
    if (form.values.from > to) {
      form.setFieldValue("from", to);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Edit layer"
      centered
      size={isMobile ? "100%" : "md"}
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Switch
            label="Transparent background"
            checked={form.values.transparentBackground}
            onChange={(event) => handleTransparentChange(event.currentTarget.checked)}
            disabled={submitting}
          />
          {!form.values.transparentBackground ? (
            <ColorInput
              label="Layer background color"
              format="hex"
              disabled={submitting}
              {...form.getInputProps("color")}
            />
          ) : null}

          <Group grow align="flex-start">
            <NumberInput
              label="From (frame)"
              min={0}
              max={maxFrame}
              disabled={submitting}
              value={form.values.from}
              onChange={handleFromChange}
              error={form.errors.from}
            />
            <NumberInput
              label="To (frame)"
              min={0}
              max={maxFrame}
              disabled={submitting}
              value={form.values.to}
              onChange={handleToChange}
              error={form.errors.to}
            />
          </Group>

          <Select
            label="Content"
            data={[...CONTENT_TYPE_OPTIONS]}
            value={contentType}
            onChange={handleContentTypeChange}
            disabled={submitting}
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
                disabled={submitting}
                {...form.getInputProps("text")}
              />
              <NumberInput
                label="Font size"
                min={8}
                max={400}
                disabled={submitting}
                {...form.getInputProps("textFontSize")}
              />
              <ColorInput
                label="Text color"
                format="hex"
                disabled={submitting}
                {...form.getInputProps("textColor")}
              />
              <GoogleFontPicker
                value={form.values.textFontImportName}
                disabled={submitting}
                onChange={(importName, fontFamily) => {
                  form.setFieldValue("textFontImportName", importName);
                  form.setFieldValue("textFontFamily", fontFamily);
                }}
              />
            </Stack>
          ) : null}

          <Group justify="flex-end" gap="xs">
            <Button variant="default" onClick={handleClose} disabled={submitting} type="button">
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Save layer
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

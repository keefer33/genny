import { Button, Group, Modal, NumberInput, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useEffect } from "react";
import useAppStore from "~/lib/stores/appStore";
import {
  DEFAULT_STORYBOARD_FPS,
  DEFAULT_STORYBOARD_HEIGHT,
  DEFAULT_STORYBOARD_WIDTH,
  EMPTY_STORYBOARD_FORM,
  type StoryboardFormValues,
} from "~/pages/storyboards/storyboardUtils";

type StoryboardUpsertModalProps = {
  opened: boolean;
  onClose: () => void;
  title: string;
  submitLabel: string;
  submitting?: boolean;
  initialValues?: Partial<StoryboardFormValues>;
  onSubmit: (values: StoryboardFormValues) => Promise<void> | void;
};

function normalizeInitialValues(
  initialValues?: Partial<StoryboardFormValues>
): StoryboardFormValues {
  return {
    title: initialValues?.title ?? EMPTY_STORYBOARD_FORM.title,
    width: initialValues?.width ?? DEFAULT_STORYBOARD_WIDTH,
    height: initialValues?.height ?? DEFAULT_STORYBOARD_HEIGHT,
    fps: initialValues?.fps ?? DEFAULT_STORYBOARD_FPS,
  };
}

function positiveNumberMessage(label: string, value: number) {
  if (!Number.isFinite(value) || value < 1) {
    return `${label} must be at least 1`;
  }
  return null;
}

export function StoryboardUpsertModal({
  opened,
  onClose,
  title,
  submitLabel,
  submitting = false,
  initialValues,
  onSubmit,
}: StoryboardUpsertModalProps) {
  const isMobile = useAppStore((s) => s.isMobile);

  const form = useForm<StoryboardFormValues>({
    initialValues: EMPTY_STORYBOARD_FORM,
    validate: {
      width: (value) => positiveNumberMessage("Width", value),
      height: (value) => positiveNumberMessage("Height", value),
      fps: (value) => positiveNumberMessage("FPS", value),
    },
  });

  useEffect(() => {
    if (!opened) return;
    form.setValues(normalizeInitialValues(initialValues));
    form.resetDirty();
  }, [opened, initialValues]);

  const handleClose = () => {
    if (submitting) return;
    onClose();
    form.reset();
  };

  const handleSubmit = form.onSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={title}
      centered
      size={isMobile ? "100%" : "md"}
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label="Title"
            placeholder="Untitled storyboard"
            disabled={submitting}
            {...form.getInputProps("title")}
          />
          <Group grow align="flex-start">
            <NumberInput
              label="Width"
              min={1}
              disabled={submitting}
              {...form.getInputProps("width")}
            />
            <NumberInput
              label="Height"
              min={1}
              disabled={submitting}
              {...form.getInputProps("height")}
            />
            <NumberInput label="FPS" min={1} disabled={submitting} {...form.getInputProps("fps")} />
          </Group>
          <Group justify="flex-end" gap="xs">
            <Button variant="default" onClick={handleClose} disabled={submitting} type="button">
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {submitLabel}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

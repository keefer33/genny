import { Button, Group, NumberInput, Stack, TextInput, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useEffect } from "react";
import {
  DEFAULT_STORYBOARD_FPS,
  DEFAULT_STORYBOARD_HEIGHT,
  DEFAULT_STORYBOARD_WIDTH,
  EMPTY_STORYBOARD_FORM,
  type StoryboardFormValues,
} from "~/pages/storyboards/storyboardUtils";

type StoryboardUpsertFormProps = {
  active: boolean;
  title: string;
  submitLabel: string;
  submitting?: boolean;
  initialValues?: Partial<StoryboardFormValues>;
  onSubmit: (values: StoryboardFormValues) => Promise<void> | void;
  onCancel?: () => void;
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

export function StoryboardUpsertForm({
  active,
  title,
  submitLabel,
  submitting = false,
  initialValues,
  onSubmit,
  onCancel,
}: StoryboardUpsertFormProps) {
  const form = useForm<StoryboardFormValues>({
    initialValues: EMPTY_STORYBOARD_FORM,
    validate: {
      width: (value) => positiveNumberMessage("Width", value),
      height: (value) => positiveNumberMessage("Height", value),
      fps: (value) => positiveNumberMessage("FPS", value),
    },
  });

  useEffect(() => {
    if (!active) return;
    form.setValues(normalizeInitialValues(initialValues));
    form.resetDirty();
  }, [active, initialValues]);

  const handleSubmit = form.onSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <Title order={5}>{title}</Title>
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
          {onCancel ? (
            <Button variant="default" onClick={onCancel} disabled={submitting} type="button">
              Cancel
            </Button>
          ) : null}
          <Button type="submit" loading={submitting}>
            {submitLabel}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}

import { Modal } from "@mantine/core";
import useAppStore from "~/lib/stores/appStore";
import { StoryboardUpsertForm } from "~/pages/storyboards/components/StoryboardUpsertForm";
import type { StoryboardFormValues } from "~/pages/storyboards/storyboardUtils";

type StoryboardUpsertModalProps = {
  opened: boolean;
  onClose: () => void;
  title: string;
  submitLabel: string;
  submitting?: boolean;
  initialValues?: Partial<StoryboardFormValues>;
  onSubmit: (values: StoryboardFormValues) => Promise<void> | void;
};

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

  const handleSubmit = async (values: StoryboardFormValues) => {
    await onSubmit(values);
  };

  return (
    <Modal opened={opened} onClose={onClose} centered size={isMobile ? "100%" : "md"}>
      <StoryboardUpsertForm
        active={opened}
        title={title}
        submitLabel={submitLabel}
        submitting={submitting}
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}

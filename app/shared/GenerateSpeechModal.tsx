import { Button, Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { RiSoundModuleLine } from "@remixicon/react";
import useVoicesStore from "~/lib/stores/voicesStore";
import { GenerateSpeechForm, type GenerateSpeechFormProps } from "~/shared/GenerateSpeechForm";

export type GenerateSpeechModalProps = Omit<
  GenerateSpeechFormProps,
  "showCancel" | "onCancel" | "description" | "submitLabel"
> & {
  /** Trigger button label */
  buttonLabel?: string;
  /** Disable the open button */
  disabled?: boolean;
};

export function GenerateSpeechModal({
  voiceId,
  inworldVoiceId,
  onGenerated,
  buttonLabel = "Generate",
  disabled = false,
}: GenerateSpeechModalProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const speechSynthesizeLoading = useVoicesStore((s) => s.speechSynthesizeLoading);

  const hasInworldVoice = Boolean(inworldVoiceId?.trim());

  const handleClose = () => {
    if (speechSynthesizeLoading) return;
    close();
  };

  return (
    <>
      <Button
        leftSection={<RiSoundModuleLine size={18} />}
        onClick={open}
        disabled={disabled || !hasInworldVoice}
        size="xs"
      >
        {buttonLabel}
      </Button>

      <Modal
        opened={opened}
        onClose={handleClose}
        title="Generate speech"
        centered
        size="lg"
        closeOnClickOutside={!speechSynthesizeLoading}
        closeOnEscape={!speechSynthesizeLoading}
      >
        {opened ? (
          <GenerateSpeechForm
            key="generate-speech-modal-form"
            voiceId={voiceId}
            inworldVoiceId={inworldVoiceId}
            showCancel
            submitLabel="Generate"
            onCancel={handleClose}
            onGenerated={(speech) => {
              onGenerated?.(speech);
              close();
            }}
          />
        ) : null}
      </Modal>
    </>
  );
}

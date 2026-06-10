import { Button, Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { RiSoundModuleLine } from "@remixicon/react";
import useVoicesStore from "~/lib/stores/voicesStore";
import { inworldProviderVoiceId } from "~/pages/voices/voiceUtils";
import { GenerateSpeechForm } from "~/shared/GenerateSpeechForm";
import useAppStore from "~/lib/stores/appStore";

export type GenerateSpeechModalProps = {
  /** Trigger button label */
  buttonLabel?: string;
  /** Disable the open button */
  disabled?: boolean;
};

export function GenerateSpeechModal({
  buttonLabel = "Generate",
  disabled = false,
}: GenerateSpeechModalProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const selectedVoice = useVoicesStore((s) => s.selectedVoice);
  const speechSynthesizeLoading = useVoicesStore((s) => s.speechSynthesizeLoading);
  const isMobile = useAppStore((s) => s.isMobile);
  const hasInworldVoice = Boolean(
    selectedVoice ? inworldProviderVoiceId(selectedVoice)?.trim() : ""
  );

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
        fullScreen={isMobile}
      >
        {opened ? (
          <GenerateSpeechForm
            key="generate-speech-modal-form"
            showCancel
            submitLabel="Generate"
            onCancel={handleClose}
            onGenerated={() => close()}
          />
        ) : null}
      </Modal>
    </>
  );
}

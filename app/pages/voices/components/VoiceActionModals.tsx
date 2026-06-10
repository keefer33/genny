import { ModalVoiceDelete } from "~/pages/voices/components/ModalVoiceDelete";
import { ModalVoiceEdit } from "~/pages/voices/components/ModalVoiceEdit";

/** Edit / delete modals driven by `voicesStore` (no props). */
export function VoiceActionModals() {
  return (
    <>
      <ModalVoiceEdit />
      <ModalVoiceDelete />
    </>
  );
}

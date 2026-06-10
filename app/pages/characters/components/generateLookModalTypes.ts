import type { ReactNode } from "react";
import type { UserVoice, UserVoiceSpeech } from "~/lib/stores/voicesStore";
import type { BaseLookPickerOption } from "~/pages/characters/components/CharacterBaseLookPicker";
import type { GenerateLookRetryDraft } from "~/pages/characters/characterGenerateLookRetryUtils";

export type GenerateLookSubmitValues = {
  modelId: string;
  payload: Record<string, unknown>;
  name: string;
  lookId?: string;
};

export type GenerateLookModalSharedProps = {
  kind?: "look" | "scene" | "video";
  title?: string;
  submitLabel?: string;
  retryDraft?: GenerateLookRetryDraft | null;
};

export type GenerateLookModalControlledProps = GenerateLookModalSharedProps & {
  opened: boolean;
  onClose: () => void;
  submitting?: boolean;
  baseLookOptions?: BaseLookPickerOption[];
  voiceSpeeches?: UserVoiceSpeech[];
  characterVoice?: UserVoice | null;
  onSubmit: (values: GenerateLookSubmitValues) => void;
};

export type GenerateLookModalCharacterProps = GenerateLookModalSharedProps & {
  characterId: string | null | undefined;
  onGenerated?: () => void | Promise<void>;
  renderTrigger?: (ctx: { open: () => void; opening: boolean; label: string }) => ReactNode;
};

export type GenerateLookModalProps =
  | GenerateLookModalControlledProps
  | GenerateLookModalCharacterProps;

export function isCharacterMode(
  props: GenerateLookModalProps
): props is GenerateLookModalCharacterProps {
  return "characterId" in props;
}

export type GenerateLookModalDialogProps = GenerateLookModalSharedProps & {
  opened: boolean;
  onClose: () => void;
  submitting: boolean;
  baseLookOptions: BaseLookPickerOption[];
  voiceSpeeches: UserVoiceSpeech[];
  characterVoice: UserVoice | null;
  onSubmit: (values: GenerateLookSubmitValues) => void;
};

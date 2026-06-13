import { Button } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { RiImageAddLine } from "@remixicon/react";
import { useCallback, useMemo, useState } from "react";
import { authFetchJson } from "~/lib/stores/authFetch";
import useCharactersStore from "~/lib/stores/charactersStore";
import useVoicesStore, { type UserVoice, type UserVoiceSpeech } from "~/lib/stores/voicesStore";
import { endpoint } from "~/lib/utils";
import { EMPTY_CHARACTER_LOOKS } from "~/pages/characters/characterLookTypes";
import type { CharacterScene } from "~/pages/characters/characterSceneGenerationUtils";
import {
  buildBaseLookPickerOptionsForVideo,
  buildBaseLookPickerOptionsFromLooks,
} from "~/pages/characters/components/CharacterBaseLookPicker";
import GenerateLookModalDialog from "~/pages/characters/components/GenerateLookModalDialog";
import {
  isCharacterMode,
  type GenerateLookModalProps,
  type GenerateLookSubmitValues,
} from "~/pages/characters/components/generateLookModalTypes";

export type { GenerateLookSubmitValues } from "~/pages/characters/components/generateLookModalTypes";

export function GenerateLookModal(props: GenerateLookModalProps) {
  const kind = props.kind ?? "look";
  const characterId = "characterId" in props ? (props.characterId?.trim() ?? "") : "";
  const [opened, { open, close }] = useDisclosure(false);
  const [opening, setOpening] = useState(false);
  const [characterVoice, setCharacterVoice] = useState<UserVoice | null>(null);
  const [voiceSpeeches, setVoiceSpeeches] = useState<UserVoiceSpeech[]>([]);
  const [characterScenes, setCharacterScenes] = useState<CharacterScene[]>([]);

  const generateCharacterLook = useCharactersStore((s) => s.generateCharacterLook);
  const generateCharacterScene = useCharactersStore((s) => s.generateCharacterScene);
  const generateCharacterVideo = useCharactersStore((s) => s.generateCharacterVideo);
  const generateLookLoading = useCharactersStore((s) => s.generateLookLoading);
  const generateSceneLoading = useCharactersStore((s) => s.generateSceneLoading);
  const generateVideoLoading = useCharactersStore((s) => s.generateVideoLoading);
  const fetchCharacterById = useCharactersStore((s) => s.fetchCharacterById);
  const fetchCharacterLooks = useCharactersStore((s) => s.fetchCharacterLooks);
  const characterLooks = useCharactersStore((s) =>
    characterId
      ? (s.characterLooksById[characterId] ?? EMPTY_CHARACTER_LOOKS)
      : EMPTY_CHARACTER_LOOKS
  );
  const getVoiceById = useVoicesStore((s) => s.getVoiceById);
  const getVoiceSpeeches = useVoicesStore((s) => s.getVoiceSpeeches);
  const generateLoading =
    kind === "video"
      ? generateVideoLoading
      : kind === "scene"
        ? generateSceneLoading
        : generateLookLoading;
  const generateButtonLabel =
    kind === "video" ? "Generate video" : kind === "scene" ? "Generate scene" : "Generate look";

  const handleOpen = useCallback(async () => {
    if (!isCharacterMode(props)) return;
    const id = props.characterId?.trim();
    if (!id) return;

    setOpening(true);
    setCharacterVoice(null);
    setVoiceSpeeches([]);
    setCharacterScenes([]);

    try {
      await fetchCharacterLooks(id);

      if (kind === "video" || kind === "scene") {
        const data = await authFetchJson<{ scenes?: CharacterScene[] }>(
          `${endpoint}/characters/${encodeURIComponent(id)}/scenes`,
          undefined,
          { errorMessage: "Failed to load character scenes" }
        );
        setCharacterScenes(data.scenes ?? []);
      }

      const character = await fetchCharacterById(id, { silent: true });
      const voiceId = character?.voice_id?.trim();
      if (voiceId) {
        const voice = await getVoiceById(voiceId);
        setCharacterVoice(voice);
        setVoiceSpeeches(await getVoiceSpeeches(voiceId));
      }

      open();
    } finally {
      setOpening(false);
    }
  }, [props, kind, fetchCharacterLooks, fetchCharacterById, getVoiceById, getVoiceSpeeches, open]);

  const handleCharacterSubmit = useCallback(
    async (values: GenerateLookSubmitValues) => {
      if (!isCharacterMode(props)) return;
      const id = props.characterId?.trim();
      if (!id) return;

      const ok =
        kind === "video"
          ? await generateCharacterVideo(id, values)
          : kind === "scene"
            ? await generateCharacterScene(id, values)
            : await generateCharacterLook(id, values);
      if (ok) {
        close();
        await props.onGenerated?.();
      }
    },
    [props, kind, generateCharacterLook, generateCharacterScene, generateCharacterVideo, close]
  );

  const baseLookOptions = useMemo(
    () =>
      kind === "video" || kind === "scene"
        ? buildBaseLookPickerOptionsForVideo(characterLooks, characterScenes)
        : buildBaseLookPickerOptionsFromLooks(characterLooks),
    [kind, characterLooks, characterScenes]
  );

  if (isCharacterMode(props)) {
    const trigger = props.renderTrigger?.({
      open: () => void handleOpen(),
      opening,
      label: generateButtonLabel,
    }) ?? (
      <Button
        size="xs"
        leftSection={<RiImageAddLine size={16} />}
        loading={opening}
        onClick={() => void handleOpen()}
      >
        {generateButtonLabel}
      </Button>
    );

    return (
      <>
        {trigger}
        <GenerateLookModalDialog
          opened={opened}
          onClose={close}
          submitting={generateLoading}
          kind={kind}
          title={props.title}
          submitLabel={props.submitLabel}
          retryDraft={props.retryDraft}
          baseLookOptions={baseLookOptions}
          voiceSpeeches={voiceSpeeches}
          characterVoice={characterVoice}
          onSubmit={(values) => void handleCharacterSubmit(values)}
        />
      </>
    );
  }

  return (
    <GenerateLookModalDialog
      opened={props.opened}
      onClose={props.onClose}
      submitting={props.submitting ?? false}
      kind={kind}
      title={props.title}
      submitLabel={props.submitLabel}
      retryDraft={props.retryDraft}
      baseLookOptions={props.baseLookOptions ?? []}
      voiceSpeeches={props.voiceSpeeches ?? []}
      characterVoice={props.characterVoice ?? null}
      onSubmit={props.onSubmit}
    />
  );
}

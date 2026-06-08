import { ActionIcon, Button, Group, Loader, Modal, Select, Stack, Text } from "@mantine/core";
import { RiPauseCircleLine, RiPlayCircleLine } from "@remixicon/react";
import { useEffect, useMemo, useState } from "react";
import useAppStore from "~/lib/stores/appStore";
import useCharactersStore, { type CharacterFormValues } from "~/lib/stores/charactersStore";
import useGenerationsStore from "~/lib/stores/generateStore";
import useVoicesStore, { getVoicePreviewUrl, type UserVoice } from "~/lib/stores/voicesStore";
import { CharacterAiAssistBar } from "~/pages/characters/components/CharacterAiAssistBar";
import { CharacterFormFields } from "~/pages/characters/components/CharacterFormFields";
import {
  CharacterLookModelFields,
  getUiFieldDefaults,
} from "~/pages/characters/components/CharacterLookModelFields";
import { CostBadge } from "~/shared/CostBadge";

type CharacterUpsertModalProps = {
  opened: boolean;
  onClose: () => void;
  title: string;
  submitLabel: string;
  submitting?: boolean;
  initialValues?: Partial<CharacterFormValues>;
  showUseVoiceProfileButton?: boolean;
  showLookModelPicker?: boolean;
  onSubmit: (values: CharacterFormValues) => Promise<void> | void;
};

const EMPTY_VALUES: CharacterFormValues = {
  name: "",
  description: "",
  voiceId: null,
  gender: null,
  age: null,
  ethnicity: null,
};

function normalizeInitialValues(initialValues?: Partial<CharacterFormValues>): CharacterFormValues {
  return {
    name: initialValues?.name ?? EMPTY_VALUES.name,
    description: initialValues?.description ?? EMPTY_VALUES.description,
    voiceId: initialValues?.voiceId ?? EMPTY_VALUES.voiceId,
    gender: initialValues?.gender ?? EMPTY_VALUES.gender,
    age: initialValues?.age ?? EMPTY_VALUES.age,
    ethnicity: initialValues?.ethnicity ?? EMPTY_VALUES.ethnicity,
  };
}

export function CharacterUpsertModal({
  opened,
  onClose,
  title,
  submitLabel,
  submitting = false,
  initialValues,
  showUseVoiceProfileButton = false,
  showLookModelPicker = false,
  onSubmit,
}: CharacterUpsertModalProps) {
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [age, setAge] = useState<string | null>(null);
  const [ethnicity, setEthnicity] = useState("");
  const [selectedCreateModelId, setSelectedCreateModelId] = useState<string | null>(null);
  const [lookModelPayload, setLookModelPayload] = useState<Record<string, unknown>>({});
  const [createCost, setCreateCost] = useState<number | null>(null);
  const [createCostLoading, setCreateCostLoading] = useState(false);

  const assistLoading = useCharactersStore((s) => s.assistLoading);
  const assistCharacterDesign = useCharactersStore((s) => s.assistCharacterDesign);
  const lookModelOptions = useCharactersStore((s) => s.lookModelOptions);
  const lookModelOptionsLoading = useCharactersStore((s) => s.lookModelOptionsLoading);
  const loadLookModelOptions = useCharactersStore((s) => s.loadLookModelOptions);
  const calculateGenerateCost = useGenerationsStore((s) => s.calculateGenerateCost);
  const userId = useAppStore((s) => s.getUser()?.user?.id ?? "");
  const userVoices = useVoicesStore((s) => s.userVoices);
  const libraryVoices = useVoicesStore((s) => s.libraryVoices);
  const userVoicesLoading = useVoicesStore((s) => s.userVoicesLoading);
  const libraryVoicesLoading = useVoicesStore((s) => s.libraryVoicesLoading);
  const loadUserVoices = useVoicesStore((s) => s.loadUserVoices);
  const loadLibraryVoices = useVoicesStore((s) => s.loadLibraryVoices);

  const busy = submitting || assistLoading;

  useEffect(() => {
    if (!opened) {
      if (previewAudio) {
        previewAudio.pause();
        previewAudio.currentTime = 0;
      }
      setPreviewAudio(null);
      setPlayingVoiceId(null);
      const next = normalizeInitialValues(undefined);
      setName(next.name);
      setDescription(next.description);
      setVoiceId(next.voiceId ?? null);
      setGender(next.gender);
      setAge(next.age);
      setEthnicity(next.ethnicity ?? "");
      setSelectedCreateModelId(null);
      setLookModelPayload({});
      setCreateCost(null);
      setCreateCostLoading(false);
      return;
    }

    const next = normalizeInitialValues(initialValues);
    setName(next.name);
    setDescription(next.description);
    setVoiceId(next.voiceId ?? null);
    setGender(next.gender);
    setAge(next.age);
    setEthnicity(next.ethnicity ?? "");
  }, [opened, initialValues, previewAudio]);

  useEffect(() => {
    if (!opened || !showLookModelPicker) return;
    let cancelled = false;
    void loadLookModelOptions().then((options) => {
      if (cancelled) return;
      const first = options[0];
      if (first) {
        setSelectedCreateModelId(first.create_model_id);
        setLookModelPayload(getUiFieldDefaults(first.fields.ui));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [opened, showLookModelPicker, loadLookModelOptions]);

  useEffect(() => {
    if (!opened) return;
    if (userId) void loadUserVoices(userId);
    void loadLibraryVoices();
  }, [opened, userId, loadUserVoices, loadLibraryVoices]);

  useEffect(() => {
    if (!previewAudio) return;
    const onEnded = () => setPlayingVoiceId(null);
    previewAudio.addEventListener("ended", onEnded);
    return () => previewAudio.removeEventListener("ended", onEnded);
  }, [previewAudio]);

  const voiceOptions = useMemo(() => {
    const mappedUser = userVoices
      .map((voice) => ({
        value: voice.id,
        label: voice.name?.trim() || "Untitled voice",
      }))
      .filter((voice) => voice.value.trim().length > 0);
    const seen = new Set(mappedUser.map((voice) => voice.value));
    const mappedLibrary = libraryVoices
      .map((voice) => ({
        value: voice.id,
        label: voice.name?.trim() || "Untitled voice",
      }))
      .filter((voice) => voice.value.trim().length > 0 && !seen.has(voice.value));
    return [
      { group: "My voices", items: mappedUser },
      { group: "Voice library", items: mappedLibrary },
    ].filter((group) => group.items.length > 0);
  }, [userVoices, libraryVoices]);

  const allVoicesById = useMemo(() => {
    const map = new Map<string, UserVoice>();
    for (const voice of [...userVoices, ...libraryVoices]) {
      const id = voice.id?.trim();
      if (!id) continue;
      if (!map.has(id)) map.set(id, voice);
    }
    return map;
  }, [userVoices, libraryVoices]);

  const selectedVoice = useMemo(() => {
    if (!voiceId) return null;
    return allVoicesById.get(voiceId) ?? null;
  }, [voiceId, allVoicesById]);

  const selectedLookModel = useMemo(() => {
    if (!selectedCreateModelId) return null;
    return (
      lookModelOptions.find((option) => option.create_model_id === selectedCreateModelId) ?? null
    );
  }, [lookModelOptions, selectedCreateModelId]);

  const lookModelSelectData = useMemo(
    () =>
      lookModelOptions.map((option) => ({
        value: option.create_model_id,
        label: option.label,
      })),
    [lookModelOptions]
  );

  const handleLookModelChange = (createModelId: string | null) => {
    if (!createModelId) return;
    const option = lookModelOptions.find((item) => item.create_model_id === createModelId);
    if (!option) return;
    setSelectedCreateModelId(createModelId);
    setLookModelPayload(getUiFieldDefaults(option.fields.ui));
  };

  const handleLookModelFieldChange = (key: string, value: unknown) => {
    setLookModelPayload((current) => ({ ...current, [key]: value }));
  };

  const toggleVoicePreview = async (voiceIdToToggle: string) => {
    const voice = allVoicesById.get(voiceIdToToggle);
    if (!voice) return;
    const previewUrl = getVoicePreviewUrl(voice);
    if (!previewUrl) return;

    if (previewAudio && playingVoiceId === voiceIdToToggle) {
      previewAudio.pause();
      setPlayingVoiceId(null);
      return;
    }

    if (previewAudio) {
      previewAudio.pause();
      previewAudio.currentTime = 0;
    }

    const audio = new Audio(previewUrl);
    setPreviewAudio(audio);
    setPlayingVoiceId(voiceIdToToggle);
    try {
      await audio.play();
    } catch {
      setPlayingVoiceId(null);
    }
  };

  const handleUseVoiceProfile = () => {
    if (!selectedVoice) return;
    const nextName = selectedVoice.name?.trim() ?? "";
    const nextDescription = selectedVoice.description?.trim() ?? "";
    const nextGender = selectedVoice.gender?.trim() ?? "";
    const nextAge = selectedVoice.age?.trim() ?? "";
    const nextAccent = selectedVoice.accent?.trim() ?? "";
    if (nextName) setName(nextName);
    if (nextDescription) setDescription(nextDescription);
    setGender(nextGender || null);
    setAge(nextAge || null);
    if (nextAccent) setEthnicity(nextAccent);
  };

  const handleAiAssist = async () => {
    const result = await assistCharacterDesign({
      description: description.trim() || undefined,
      name: name.trim() || undefined,
      gender,
      age,
      ethnicity: ethnicity.trim() || null,
    });
    if (!result) return;
    setDescription(result.description);
    if (result.name.trim()) setName(result.name.trim());
    setGender(result.gender);
    setAge(result.age);
    if (result.ethnicity) setEthnicity(result.ethnicity);
  };

  const trimmedName = name.trim();
  const trimmedDescription = description.trim();
  const hasLookModel = !showLookModelPicker || Boolean(selectedLookModel);
  const canSubmit = Boolean(trimmedName && trimmedDescription && hasLookModel);

  const mergedLookPayload = useMemo(() => {
    if (!selectedLookModel) return null;
    return { ...selectedLookModel.fields.default, ...lookModelPayload };
  }, [selectedLookModel, lookModelPayload]);

  const lookCostDriverSnapshot = useMemo(() => {
    if (!showLookModelPicker || !selectedLookModel || !mergedLookPayload || !trimmedDescription) {
      return "";
    }
    return JSON.stringify({
      modelId: selectedLookModel.create_model_id,
      payload: { ...mergedLookPayload, prompt: trimmedDescription },
    });
  }, [showLookModelPicker, selectedLookModel, mergedLookPayload, trimmedDescription]);

  useEffect(() => {
    if (
      !opened ||
      !showLookModelPicker ||
      !lookCostDriverSnapshot ||
      !selectedLookModel ||
      !mergedLookPayload
    ) {
      setCreateCost(null);
      setCreateCostLoading(false);
      return;
    }

    let cancelled = false;
    const timeoutId = setTimeout(() => {
      setCreateCostLoading(true);
      void calculateGenerateCost({
        modelId: selectedLookModel.create_model_id,
        payload: { ...mergedLookPayload, prompt: trimmedDescription },
      })
        .then((singleImageCost) => {
          if (!cancelled) setCreateCost(singleImageCost * 4);
        })
        .catch(() => {
          if (!cancelled) setCreateCost(null);
        })
        .finally(() => {
          if (!cancelled) setCreateCostLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [
    opened,
    showLookModelPicker,
    lookCostDriverSnapshot,
    selectedLookModel,
    mergedLookPayload,
    trimmedDescription,
    calculateGenerateCost,
  ]);

  const values: CharacterFormValues = {
    name: trimmedName,
    description: trimmedDescription,
    voiceId,
    gender,
    age,
    ethnicity: ethnicity.trim() || null,
    lookModel:
      showLookModelPicker && selectedLookModel
        ? {
            createModelId: selectedLookModel.create_model_id,
            editModelId: selectedLookModel.edit_model_id,
            payload: lookModelPayload,
          }
        : undefined,
  };

  return (
    <Modal opened={opened} onClose={onClose} title={title} centered size="md">
      <Stack gap="md">
        <CharacterAiAssistBar
          loading={assistLoading}
          disabled={busy}
          onAssist={() => void handleAiAssist()}
        />
        <Select
          label="Voice"
          placeholder="Optional"
          clearable
          searchable
          data={voiceOptions}
          value={voiceId}
          onChange={(value) => setVoiceId(typeof value === "string" ? value : null)}
          disabled={busy || userVoicesLoading || libraryVoicesLoading}
          renderOption={({ option }) => {
            const optionVoiceId = String(option.value ?? "");
            const voice = allVoicesById.get(optionVoiceId);
            const previewUrl = voice ? getVoicePreviewUrl(voice) : null;
            const isPlaying = playingVoiceId === optionVoiceId;

            return (
              <Group justify="space-between" wrap="nowrap" gap="xs">
                {previewUrl ? (
                  <ActionIcon
                    variant="subtle"
                    size="sm"
                    aria-label={isPlaying ? "Pause voice preview" : "Play voice preview"}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      void toggleVoicePreview(optionVoiceId);
                    }}
                  >
                    {isPlaying ? <RiPauseCircleLine size={24} /> : <RiPlayCircleLine size={24} />}
                  </ActionIcon>
                ) : null}
                <Text size="sm" style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                  {option.label}
                </Text>
              </Group>
            );
          }}
        />
        {showUseVoiceProfileButton && selectedVoice ? (
          <Button variant="light" onClick={handleUseVoiceProfile} disabled={busy}>
            Use voice profile for your character
          </Button>
        ) : null}
        <CharacterFormFields
          name={name}
          description={description}
          gender={gender}
          age={age}
          ethnicity={ethnicity}
          disabled={busy}
          onNameChange={setName}
          onDescriptionChange={setDescription}
          onGenderChange={setGender}
          onAgeChange={setAge}
          onEthnicityChange={setEthnicity}
        />
        {showLookModelPicker ? (
          <>
            <Select
              label="Look generation model"
              placeholder="Choose a model"
              data={lookModelSelectData}
              value={selectedCreateModelId}
              onChange={(value) => handleLookModelChange(typeof value === "string" ? value : null)}
              disabled={busy || lookModelOptionsLoading || lookModelSelectData.length === 0}
              allowDeselect={false}
            />
            {selectedLookModel ? (
              <CharacterLookModelFields
                ui={selectedLookModel.fields.ui}
                values={lookModelPayload}
                disabled={busy}
                onChange={handleLookModelFieldChange}
              />
            ) : null}
          </>
        ) : null}
        <Group justify="flex-end" gap="xs" wrap="wrap">
          <Button variant="default" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            disabled={!canSubmit || busy}
            loading={submitting}
            onClick={() => void onSubmit(values)}
            rightSection={
              showLookModelPicker ? (
                createCostLoading ? (
                  <Loader type="dots" color="gray.4" size="sm" />
                ) : createCost != null ? (
                  <CostBadge cost={createCost} size="sm" clickable={false} />
                ) : null
              ) : null
            }
          >
            {submitLabel}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

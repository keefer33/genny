import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Container,
  Group,
  Loader,
  Modal,
  Popover,
  ScrollArea,
  Select,
  Stack,
  Tabs,
  Text,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  RiDeleteBinLine,
  RiEditLine,
  RiImageLine,
  RiMovie2Line,
  RiPencilLine,
  RiVideoLine,
} from "@remixicon/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  useCharacterDetailRealtime,
  useCharactersRealtime,
} from "~/lib/hooks/useUserRealtimeChannels";
import { showNotification } from "~/lib/notificationUtils";
import useAppStore from "~/lib/stores/appStore";
import useCharactersStore, { type UserCharacter } from "~/lib/stores/charactersStore";
import useGenerationsStore from "~/lib/stores/generateStore";
import type { GenModelsItem } from "~/types/generations";
import {
  audioFileListsEqual,
  characterRowNeedsUpdate,
  characterVoiceId,
  genModelIdFromRunResponse,
  listAllGenerationFiles,
  mergePendingGenerationIntoMetadata,
  partitionGenerationFilesByMedia,
  removeFileFromCharacterMetadata,
  sortByCreatedAtDesc,
  type CharacterAudioFile,
  type CharacterDeletableFile,
} from "~/pages/characters/characterFileUtils";
import { CharacterAudioSection } from "~/pages/characters/components/CharacterAudioSection";
import { CharacterGenerationFilesGrid } from "~/pages/characters/components/CharacterGenerationFilesGrid";
import { CreateCharacterSpeechModal } from "~/pages/characters/components/CreateCharacterSpeechModal";
import { EditCharacterDetailsModal } from "~/pages/characters/components/EditCharacterDetailsModal";
import { characterImagePromptOverride } from "~/pages/characters/characterImagePrompt";
import ModelSchemaForm from "~/pages/generate/components/ModelSchemaForm";

/** Preferred default when opening the generate-images picker (if listed). */
const CHARACTER_DEFAULT_TEXT_TO_IMAGE_MODEL_ID = "528fb6d8-2aed-42ba-b841-c4945ab4ea6b";
/** Preferred default when opening the edit-videos picker (if listed as video-to-video). */
const CHARACTER_DEFAULT_VIDEO_TO_VIDEO_MODEL_ID = "7d6306f7-2e13-4a5c-992d-eb317e908363";
/** Preferred default when opening the generate-video picker (if listed as digital-human). */
const CHARACTER_DEFAULT_DIGITAL_HUMAN_MODEL_ID = "7508e950-5461-45ec-9d99-f7c81bfca55d";

function isTextToImageModel(model: GenModelsItem): boolean {
  return (model.model_type ?? "").trim().toLowerCase() === "text-to-image";
}

function isImageToImageModel(model: GenModelsItem): boolean {
  return (model.model_type ?? "").trim().toLowerCase() === "image-to-image";
}

function isDigitalHumanModel(model: GenModelsItem): boolean {
  return (model.model_type ?? "").trim().toLowerCase() === "digital-human";
}

function isVideoToVideoModel(model: GenModelsItem): boolean {
  return (model.model_type ?? "").trim().toLowerCase() === "video-to-video";
}

function genModelSelectLabel(model: GenModelsItem): string {
  return (
    model.model_name?.trim() ||
    model.model_variant?.trim() ||
    model.model_product?.trim() ||
    model.id
  );
}

export function meta() {
  return [{ title: "Character" }];
}

export default function CharacterDetail() {
  const { characterId } = useParams<{ characterId: string }>();
  const navigate = useNavigate();
  const { getUser, isMobile } = useAppStore();
  const userId = getUser()?.user?.id ?? "";
  const fetchCharacterById = useCharactersStore((s) => s.fetchCharacterById);
  const fetchCharacterAudioFiles = useCharactersStore((s) => s.fetchCharacterAudioFiles);
  const createCharacterSpeech = useCharactersStore((s) => s.createCharacterSpeech);
  const updateCharacter = useCharactersStore((s) => s.updateCharacter);
  const speechCreating = useCharactersStore((s) => s.speechCreating);
  const deleteCharacter = useCharactersStore((s) => s.deleteCharacter);
  const deleteCharacterFile = useCharactersStore((s) => s.deleteCharacterFile);
  const setSelectedCharacter = useCharactersStore((s) => s.setSelectedCharacter);
  const [detailsEditOpened, { open: openDetailsEdit, close: closeDetailsEdit }] =
    useDisclosure(false);
  const [detailsSaving, setDetailsSaving] = useState(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteFileTarget, setDeleteFileTarget] = useState<CharacterDeletableFile | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);

  const [character, setCharacter] = useState<UserCharacter | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const refreshDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [editVideosOpened, { open: openEditVideos, close: closeEditVideos }] = useDisclosure(false);
  const [editVideosFormKey, setEditVideosFormKey] = useState(0);
  const [editVideoModelId, setEditVideoModelId] = useState<string | null>(null);
  const [generateImagesOpened, { open: openGenerateImages, close: closeGenerateImages }] =
    useDisclosure(false);
  const [generateImagesFormKey, setGenerateImagesFormKey] = useState(0);
  const [generateImageModelId, setGenerateImageModelId] = useState<string | null>(null);
  const [editImagesOpened, { open: openEditImages, close: closeEditImages }] = useDisclosure(false);
  const [editImagesFormKey, setEditImagesFormKey] = useState(0);
  const [editImageModelId, setEditImageModelId] = useState<string | null>(null);
  const [generateVideoOpened, { open: openGenerateVideo, close: closeGenerateVideo }] =
    useDisclosure(false);
  const [generateVideoFormKey, setGenerateVideoFormKey] = useState(0);
  const [generateVideoModelId, setGenerateVideoModelId] = useState<string | null>(null);
  const [audioFiles, setAudioFiles] = useState<CharacterAudioFile[]>([]);
  const [audioFilesLoading, setAudioFilesLoading] = useState(false);
  const [speechModalOpened, { open: openSpeechModal, close: closeSpeechModal }] =
    useDisclosure(false);
  const previousSelectedModelRef = useRef<GenModelsItem | null | undefined>(undefined);
  const prevCharacterStatusRef = useRef<string | null>(null);

  const allGenModels = useGenerationsStore((s) => s.allGenModels);
  const loadGenModels = useGenerationsStore((s) => s.loadGenModels);
  const selectedModel = useGenerationsStore((s) => s.selectedModel);
  const setSelectedModel = useGenerationsStore((s) => s.setSelectedModel);

  const textToImageModels = useMemo(() => allGenModels.filter(isTextToImageModel), [allGenModels]);
  const imageToImageModels = useMemo(
    () => allGenModels.filter(isImageToImageModel),
    [allGenModels]
  );

  const textToImageModelSelectData = useMemo(
    () =>
      textToImageModels.map((model) => ({
        value: model.id,
        label: genModelSelectLabel(model),
      })),
    [textToImageModels]
  );

  const imageToImageModelSelectData = useMemo(
    () =>
      imageToImageModels.map((model) => ({
        value: model.id,
        label: genModelSelectLabel(model),
      })),
    [imageToImageModels]
  );

  const digitalHumanModels = useMemo(
    () => allGenModels.filter(isDigitalHumanModel),
    [allGenModels]
  );

  const digitalHumanModelSelectData = useMemo(
    () =>
      digitalHumanModels.map((model) => ({
        value: model.id,
        label: genModelSelectLabel(model),
      })),
    [digitalHumanModels]
  );

  const videoToVideoModels = useMemo(
    () => allGenModels.filter(isVideoToVideoModel),
    [allGenModels]
  );

  const videoToVideoModelSelectData = useMemo(
    () =>
      videoToVideoModels.map((model) => ({
        value: model.id,
        label: genModelSelectLabel(model),
      })),
    [videoToVideoModels]
  );

  const refresh = useCallback(
    async (opts?: { silent?: boolean; refreshAudio?: boolean }) => {
      const id = characterId?.trim();
      if (!userId || !id) return;
      const silent = Boolean(opts?.silent);
      const refreshAudio = opts?.refreshAudio ?? !silent;

      if (!silent) setInitialLoading(true);
      const row = await fetchCharacterById(userId, id);
      if (!silent) setInitialLoading(false);
      if (!row) {
        prevCharacterStatusRef.current = null;
        setAudioFiles([]);
        navigate("/characters", { replace: true });
        return;
      }

      const prevStatus = prevCharacterStatusRef.current;
      const status = (row.status ?? "").toLowerCase();
      const becameActive = prevStatus === "pending" && status === "active";
      prevCharacterStatusRef.current = status;

      setCharacter((prev) => {
        if (prev && !characterRowNeedsUpdate(prev, row)) return prev;
        return row;
      });

      const shouldFetchAudio = refreshAudio || becameActive;

      if (status === "pending") {
        if (!silent && refreshAudio) setAudioFiles([]);
        return;
      }
      if (!shouldFetchAudio) return;

      if (!silent) setAudioFilesLoading(true);
      try {
        const audio = await fetchCharacterAudioFiles(userId, id);
        setAudioFiles((prev) => {
          const next = sortByCreatedAtDesc(audio);
          if (audioFileListsEqual(prev, next)) return prev;
          return next;
        });
      } finally {
        if (!silent) setAudioFilesLoading(false);
      }
    },
    [userId, characterId, fetchCharacterById, fetchCharacterAudioFiles, navigate]
  );

  const scheduleSilentRefresh = useCallback(() => {
    if (refreshDebounceRef.current) clearTimeout(refreshDebounceRef.current);
    refreshDebounceRef.current = setTimeout(() => {
      refreshDebounceRef.current = null;
      void refresh({ silent: true, refreshAudio: false });
    }, 1200);
  }, [refresh]);

  useEffect(() => {
    if (!characterId?.trim()) {
      navigate("/characters", { replace: true });
      return;
    }
    void refresh();
  }, [characterId, refresh, navigate]);

  useEffect(() => {
    if (character) {
      setSelectedCharacter(character);
    }
    return () => setSelectedCharacter(null);
  }, [character, setSelectedCharacter]);

  useEffect(
    () => () => {
      if (refreshDebounceRef.current) clearTimeout(refreshDebounceRef.current);
    },
    []
  );

  useCharactersRealtime(userId || undefined);

  useEffect(() => {
    if (!userId || allGenModels.length > 0) return;
    void loadGenModels();
  }, [userId, allGenModels.length, loadGenModels]);

  const closeGenerateImagesModal = useCallback(() => {
    closeGenerateImages();
    if (previousSelectedModelRef.current !== undefined) {
      setSelectedModel(previousSelectedModelRef.current);
      previousSelectedModelRef.current = undefined;
    }
  }, [closeGenerateImages, setSelectedModel]);

  const closeEditImagesModal = useCallback(() => {
    closeEditImages();
    if (previousSelectedModelRef.current !== undefined) {
      setSelectedModel(previousSelectedModelRef.current);
      previousSelectedModelRef.current = undefined;
    }
  }, [closeEditImages, setSelectedModel]);

  const closeGenerateVideoModal = useCallback(() => {
    closeGenerateVideo();
    if (previousSelectedModelRef.current !== undefined) {
      setSelectedModel(previousSelectedModelRef.current);
      previousSelectedModelRef.current = undefined;
    }
  }, [closeGenerateVideo, setSelectedModel]);

  const closeEditVideosModal = useCallback(() => {
    closeEditVideos();
    if (previousSelectedModelRef.current !== undefined) {
      setSelectedModel(previousSelectedModelRef.current);
      previousSelectedModelRef.current = undefined;
    }
  }, [closeEditVideos, setSelectedModel]);

  useCharacterDetailRealtime(userId || undefined, characterId, scheduleSilentRefresh);

  const applyRunStartedToCharacter = useCallback((run: unknown, fallbackGenModelId?: string) => {
    const runId =
      run &&
      typeof run === "object" &&
      "id" in run &&
      typeof (run as { id: unknown }).id === "string"
        ? (run as { id: string }).id.trim()
        : "";
    const status =
      run && typeof run === "object" && "status" in run
        ? String((run as { status: unknown }).status ?? "pending")
        : "pending";
    const genModelId = genModelIdFromRunResponse(run) ?? fallbackGenModelId?.trim();
    if (runId) {
      setCharacter((prev) =>
        prev
          ? {
              ...prev,
              metadata: mergePendingGenerationIntoMetadata(prev.metadata, {
                id: runId,
                status,
                ...(genModelId ? { gen_model_id: genModelId } : {}),
              }),
            }
          : prev
      );
    }
  }, []);

  const pickDefaultTextToImageModel = useCallback((): GenModelsItem | null => {
    if (textToImageModels.length === 0) return null;
    const remembered = generateImageModelId
      ? textToImageModels.find((m) => m.id === generateImageModelId)
      : null;
    if (remembered) return remembered;
    return (
      textToImageModels.find((m) => m.id === CHARACTER_DEFAULT_TEXT_TO_IMAGE_MODEL_ID) ??
      textToImageModels[0]
    );
  }, [generateImageModelId, textToImageModels]);

  const handleOpenGenerateImages = useCallback(() => {
    const model = pickDefaultTextToImageModel();
    if (!model) {
      showNotification({
        message: "No text-to-image models are available. Try again in a moment.",
        type: "error",
      });
      return;
    }
    previousSelectedModelRef.current = useGenerationsStore.getState().selectedModel;
    setGenerateImageModelId(model.id);
    setSelectedModel(model);
    setGenerateImagesFormKey((n) => n + 1);
    openGenerateImages();
  }, [openGenerateImages, pickDefaultTextToImageModel, setSelectedModel]);

  const handleGenerateImageModelChange = useCallback(
    (modelId: string | null) => {
      if (!modelId) return;
      const model = textToImageModels.find((m) => m.id === modelId);
      if (!model) return;
      setGenerateImageModelId(modelId);
      setSelectedModel(model);
      setGenerateImagesFormKey((n) => n + 1);
    },
    [setSelectedModel, textToImageModels]
  );

  const handleGenerateImagesStarted = useCallback(
    (run: unknown) => {
      closeGenerateImagesModal();
      const modelId = selectedModel?.id ?? generateImageModelId ?? genModelIdFromRunResponse(run);
      applyRunStartedToCharacter(run, modelId);
    },
    [closeGenerateImagesModal, applyRunStartedToCharacter, selectedModel?.id, generateImageModelId]
  );

  const pickDefaultImageToImageModel = useCallback((): GenModelsItem | null => {
    if (imageToImageModels.length === 0) return null;
    const remembered = editImageModelId
      ? imageToImageModels.find((m) => m.id === editImageModelId)
      : null;
    return remembered ?? imageToImageModels[0];
  }, [editImageModelId, imageToImageModels]);

  const handleOpenEditImages = useCallback(() => {
    const model = pickDefaultImageToImageModel();
    if (!model) {
      showNotification({
        message: "No image-to-image models are available. Try again in a moment.",
        type: "error",
      });
      return;
    }
    previousSelectedModelRef.current = useGenerationsStore.getState().selectedModel;
    setEditImageModelId(model.id);
    setSelectedModel(model);
    setEditImagesFormKey((n) => n + 1);
    openEditImages();
  }, [openEditImages, pickDefaultImageToImageModel, setSelectedModel]);

  const handleEditImageModelChange = useCallback(
    (modelId: string | null) => {
      if (!modelId) return;
      const model = imageToImageModels.find((m) => m.id === modelId);
      if (!model) return;
      setEditImageModelId(modelId);
      setSelectedModel(model);
      setEditImagesFormKey((n) => n + 1);
    },
    [imageToImageModels, setSelectedModel]
  );

  const handleEditImagesStarted = useCallback(
    (run: unknown) => {
      closeEditImagesModal();
      const modelId = selectedModel?.id ?? editImageModelId ?? genModelIdFromRunResponse(run);
      applyRunStartedToCharacter(run, modelId);
    },
    [closeEditImagesModal, applyRunStartedToCharacter, selectedModel?.id, editImageModelId]
  );

  const generateImagesInitialValues = characterImagePromptOverride(character);

  const pickDefaultDigitalHumanModel = useCallback((): GenModelsItem | null => {
    if (digitalHumanModels.length === 0) return null;
    const remembered = generateVideoModelId
      ? digitalHumanModels.find((m) => m.id === generateVideoModelId)
      : null;
    if (remembered) return remembered;
    return (
      digitalHumanModels.find((m) => m.id === CHARACTER_DEFAULT_DIGITAL_HUMAN_MODEL_ID) ??
      digitalHumanModels[0]
    );
  }, [digitalHumanModels, generateVideoModelId]);

  const handleOpenGenerateVideo = useCallback(() => {
    if (!audioFilesLoading && audioFiles.length === 0) {
      showNotification({
        message: "No audio files for this character. Add a voice or speech clip first.",
        type: "error",
      });
      return;
    }
    const model = pickDefaultDigitalHumanModel();
    if (!model) {
      showNotification({
        message: "No digital-human models are available. Try again in a moment.",
        type: "error",
      });
      return;
    }
    previousSelectedModelRef.current = useGenerationsStore.getState().selectedModel;
    setGenerateVideoModelId(model.id);
    setSelectedModel(model);
    setGenerateVideoFormKey((n) => n + 1);
    openGenerateVideo();
  }, [
    audioFiles.length,
    audioFilesLoading,
    openGenerateVideo,
    pickDefaultDigitalHumanModel,
    setSelectedModel,
  ]);

  const handleGenerateVideoModelChange = useCallback(
    (modelId: string | null) => {
      if (!modelId) return;
      const model = digitalHumanModels.find((m) => m.id === modelId);
      if (!model) return;
      setGenerateVideoModelId(modelId);
      setSelectedModel(model);
      setGenerateVideoFormKey((n) => n + 1);
    },
    [digitalHumanModels, setSelectedModel]
  );

  const handleGenerateVideoStarted = useCallback(
    (run: unknown) => {
      closeGenerateVideoModal();
      const modelId = selectedModel?.id ?? generateVideoModelId ?? genModelIdFromRunResponse(run);
      applyRunStartedToCharacter(run, modelId);
    },
    [closeGenerateVideoModal, applyRunStartedToCharacter, selectedModel?.id, generateVideoModelId]
  );

  const pickDefaultVideoToVideoModel = useCallback((): GenModelsItem | null => {
    if (videoToVideoModels.length === 0) return null;
    const remembered = editVideoModelId
      ? videoToVideoModels.find((m) => m.id === editVideoModelId)
      : null;
    if (remembered) return remembered;
    return (
      videoToVideoModels.find((m) => m.id === CHARACTER_DEFAULT_VIDEO_TO_VIDEO_MODEL_ID) ??
      videoToVideoModels[0]
    );
  }, [editVideoModelId, videoToVideoModels]);

  const handleOpenEditVideos = useCallback(() => {
    const model = pickDefaultVideoToVideoModel();
    if (!model) {
      showNotification({
        message: "No video-to-video models are available. Try again in a moment.",
        type: "error",
      });
      return;
    }
    previousSelectedModelRef.current = useGenerationsStore.getState().selectedModel;
    setEditVideoModelId(model.id);
    setSelectedModel(model);
    setEditVideosFormKey((n) => n + 1);
    openEditVideos();
  }, [openEditVideos, pickDefaultVideoToVideoModel, setSelectedModel]);

  const handleEditVideoModelChange = useCallback(
    (modelId: string | null) => {
      if (!modelId) return;
      const model = videoToVideoModels.find((m) => m.id === modelId);
      if (!model) return;
      setEditVideoModelId(modelId);
      setSelectedModel(model);
      setEditVideosFormKey((n) => n + 1);
    },
    [setSelectedModel, videoToVideoModels]
  );

  const handleEditVideosStarted = useCallback(
    (run: unknown) => {
      closeEditVideosModal();
      const modelId = selectedModel?.id ?? editVideoModelId ?? genModelIdFromRunResponse(run);
      applyRunStartedToCharacter(run, modelId);
    },
    [closeEditVideosModal, applyRunStartedToCharacter, selectedModel?.id, editVideoModelId]
  );

  const characterElevenLabsVoiceId = character
    ? characterVoiceId(character.metadata, audioFiles)
    : null;
  const generationPartitions = character
    ? partitionGenerationFilesByMedia(listAllGenerationFiles(character.metadata))
    : { images: [], videos: [] };
  const imageFileCount = generationPartitions.images.length;
  const videoFileCount = generationPartitions.videos.length;
  const characterStatus = (character?.status ?? "").toLowerCase();
  const isCharacterPending = characterStatus === "pending";
  const isCharacterFailed = characterStatus === "failed";
  const isCharacterActive = characterStatus === "active";

  const isAudioPending =
    isCharacterPending ||
    (isCharacterActive && !isCharacterFailed && audioFiles.length === 0 && audioFilesLoading);

  const shouldPollVoiceCreation = isCharacterPending || isAudioPending;

  useEffect(() => {
    if (!shouldPollVoiceCreation || !userId || !characterId?.trim()) return;
    const intervalId = setInterval(() => {
      void refresh({ silent: true, refreshAudio: true });
    }, 3000);
    return () => clearInterval(intervalId);
  }, [shouldPollVoiceCreation, userId, characterId, refresh]);

  const handleCreateSpeech = useCallback(
    async (text: string) => {
      const id = characterId?.trim();
      const voiceId = characterElevenLabsVoiceId;
      if (!userId || !id || !voiceId) {
        showNotification({
          message: "Character voice is not configured.",
          type: "error",
        });
        return;
      }
      const created = await createCharacterSpeech(userId, id, voiceId, text);
      if (!created) return;
      setAudioFiles((prev) => {
        if (prev.some((f) => f.id === created.id)) return prev;
        return sortByCreatedAtDesc([...prev, created]);
      });
      closeSpeechModal();
    },
    [characterElevenLabsVoiceId, characterId, closeSpeechModal, createCharacterSpeech, userId]
  );

  const handleSaveCharacterDetails = useCallback(
    async (values: { name: string; description: string }) => {
      const id = characterId?.trim();
      if (!userId || !id) return;
      setDetailsSaving(true);
      const updated = await updateCharacter(userId, id, {
        name: values.name,
        description: values.description,
      });
      setDetailsSaving(false);
      if (!updated) return;
      setCharacter((prev) =>
        prev
          ? {
              ...prev,
              name: updated.name,
              description: updated.description,
              updated_at: updated.updated_at,
              metadata: updated.metadata,
            }
          : prev
      );
      closeDetailsEdit();
      showNotification({
        title: "Saved",
        message: "Character details updated.",
        type: "success",
      });
    },
    [characterId, closeDetailsEdit, updateCharacter, userId]
  );

  const requestDeleteFile = useCallback((file: CharacterDeletableFile) => {
    setDeleteFileTarget(file);
  }, []);

  const handleFileDeletedFromDetail = useCallback((fileId: string) => {
    setAudioFiles((prev) => prev.filter((f) => f.id !== fileId));
    setCharacter((prev) =>
      prev
        ? {
            ...prev,
            metadata: removeFileFromCharacterMetadata(prev.metadata, fileId),
          }
        : prev
    );
  }, []);

  const handleConfirmDeleteFile = useCallback(async () => {
    if (!userId || !deleteFileTarget?.id) return;
    const fileName = (deleteFileTarget.file_name ?? "").trim();
    if (!fileName) {
      showNotification({
        message: "This file cannot be deleted (missing file name).",
        type: "error",
      });
      return;
    }
    setDeletingFileId(deleteFileTarget.id);
    const ok = await deleteCharacterFile(userId, deleteFileTarget.id, fileName);
    setDeletingFileId(null);
    if (!ok) return;
    setAudioFiles((prev) => prev.filter((f) => f.id !== deleteFileTarget.id));
    setCharacter((prev) =>
      prev
        ? {
            ...prev,
            metadata: removeFileFromCharacterMetadata(prev.metadata, deleteFileTarget.id),
          }
        : prev
    );
    setDeleteFileTarget(null);
  }, [deleteFileTarget, deleteCharacterFile, userId]);

  const handleConfirmDelete = async () => {
    if (!userId || !characterId?.trim()) return;
    setDeleteBusy(true);
    const ok = await deleteCharacter(userId, characterId);
    setDeleteBusy(false);
    if (ok) {
      closeDelete();
      navigate("/characters", { replace: true });
    }
  };

  return (
    <Container size="md" p="0" px="sm">
      <Modal
        opened={editImagesOpened}
        onClose={closeEditImagesModal}
        title="Edit images"
        size="md"
        fullScreen={isMobile ? true : false}
      >
        <Stack gap="md" h="min(80vh)" style={{ minHeight: 400 }}>
          <Select
            label="Image model"
            description="Choose an image-to-image model for this character."
            placeholder="Select model"
            data={imageToImageModelSelectData}
            value={editImageModelId}
            onChange={handleEditImageModelChange}
            searchable
            nothingFoundMessage="No image-to-image models"
            comboboxProps={{ withinPortal: true }}
          />
          <Box style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            {editImageModelId && selectedModel?.id === editImageModelId ? (
              <ModelSchemaForm
                key={`${editImagesFormKey}-${editImageModelId}`}
                characterId={characterId}
                onSubmitSuccess={handleEditImagesStarted}
              />
            ) : (
              <Group justify="center" py="xl">
                <Loader size="sm" />
              </Group>
            )}
          </Box>
        </Stack>
      </Modal>
      <Modal
        opened={generateVideoOpened}
        onClose={closeGenerateVideoModal}
        title="Generate video"
        size="md"
        fullScreen={isMobile ? true : false}
      >
        <Stack gap="md" h="min(80vh)" style={{ minHeight: 400 }}>
          <Select
            label="Video model"
            description="Choose a digital-human model for this character."
            placeholder="Select model"
            data={digitalHumanModelSelectData}
            value={generateVideoModelId}
            onChange={handleGenerateVideoModelChange}
            searchable
            nothingFoundMessage="No digital-human models"
            comboboxProps={{ withinPortal: true }}
          />
          <Box style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            {generateVideoModelId && selectedModel?.id === generateVideoModelId ? (
              <ModelSchemaForm
                key={`${generateVideoFormKey}-${generateVideoModelId}`}
                characterId={characterId}
                onSubmitSuccess={handleGenerateVideoStarted}
              />
            ) : (
              <Group justify="center" py="xl">
                <Loader size="sm" />
              </Group>
            )}
          </Box>
        </Stack>
      </Modal>
      <Modal
        opened={editVideosOpened}
        onClose={closeEditVideosModal}
        title="Edit videos"
        size="md"
        fullScreen={isMobile ? true : false}
      >
        <Stack gap="md" h="min(80vh)" style={{ minHeight: 400 }}>
          <Select
            label="Video model"
            description="Choose a video-to-video model for this character."
            placeholder="Select model"
            data={videoToVideoModelSelectData}
            value={editVideoModelId}
            onChange={handleEditVideoModelChange}
            searchable
            nothingFoundMessage="No video-to-video models"
            comboboxProps={{ withinPortal: true }}
          />
          <Box style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            {editVideoModelId && selectedModel?.id === editVideoModelId ? (
              <ModelSchemaForm
                key={`${editVideosFormKey}-${editVideoModelId}`}
                characterId={characterId}
                onSubmitSuccess={handleEditVideosStarted}
              />
            ) : (
              <Group justify="center" py="xl">
                <Loader size="sm" />
              </Group>
            )}
          </Box>
        </Stack>
      </Modal>
      <Modal
        opened={generateImagesOpened}
        onClose={closeGenerateImagesModal}
        title="Generate images"
        size="md"
        fullScreen={isMobile ? true : false}
      >
        <Stack gap="md" h="min(80vh)" style={{ minHeight: 400 }}>
          <Select
            label="Image model"
            description="Choose a text-to-image model for this character."
            placeholder="Select model"
            data={textToImageModelSelectData}
            value={generateImageModelId}
            onChange={handleGenerateImageModelChange}
            searchable
            nothingFoundMessage="No text-to-image models"
            comboboxProps={{ withinPortal: true }}
          />
          <Box style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            {generateImageModelId && selectedModel?.id === generateImageModelId ? (
              <ModelSchemaForm
                key={`${generateImagesFormKey}-${generateImageModelId}`}
                initialValuesOverride={generateImagesInitialValues}
                characterId={characterId}
                onSubmitSuccess={handleGenerateImagesStarted}
              />
            ) : (
              <Group justify="center" py="xl">
                <Loader size="sm" />
              </Group>
            )}
          </Box>
        </Stack>
      </Modal>
      <EditCharacterDetailsModal
        opened={detailsEditOpened}
        onClose={closeDetailsEdit}
        initialName={character?.name ?? ""}
        initialDescription={character?.description ?? ""}
        submitting={detailsSaving}
        onSubmit={(values) => void handleSaveCharacterDetails(values)}
      />
      <CreateCharacterSpeechModal
        opened={speechModalOpened}
        onClose={closeSpeechModal}
        voiceId={characterElevenLabsVoiceId}
        submitting={speechCreating}
        onSubmit={(text) => void handleCreateSpeech(text)}
      />
      <Modal
        opened={Boolean(deleteFileTarget)}
        onClose={() => setDeleteFileTarget(null)}
        title="Delete file"
        centered
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm">
            Permanently delete this file from storage and your library? This cannot be undone.
          </Text>
          <Group justify="flex-end" gap="xs">
            <Button
              variant="default"
              onClick={() => setDeleteFileTarget(null)}
              disabled={Boolean(deletingFileId)}
            >
              Cancel
            </Button>
            <Button
              color="red"
              loading={Boolean(deletingFileId)}
              onClick={() => void handleConfirmDeleteFile()}
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
      <Modal
        opened={deleteOpened}
        onClose={closeDelete}
        title="Delete character"
        centered
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm">
            Permanently delete &quot;{character?.name ?? "this character"}&quot; and all generated
            files?
          </Text>
          <Text size="sm">This cannot be undone.</Text>
          <Group justify="flex-end" gap="xs">
            <Button variant="default" onClick={closeDelete} disabled={deleteBusy}>
              Cancel
            </Button>
            <Button color="red" onClick={() => void handleConfirmDelete()} loading={deleteBusy}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
      <Box
        h="calc(100dvh - var(--app-shell-header-height, 0px) - var(--app-shell-footer-height, 0px))"
        style={{ minHeight: 0 }}
      >
        <Stack gap="md" h="100%" style={{ minHeight: 0 }}>
          {initialLoading && !character ? (
            <Group justify="center" py="xl">
              <Loader />
            </Group>
          ) : character ? (
            <Stack gap="md" style={{ flex: 1, minHeight: 0 }}>
              <Group justify="space-between" wrap="nowrap" align="flex-start">
                <Group gap="sm" align="flex-start" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                  <Popover width={360} position="bottom-start" withArrow shadow="md">
                    <Popover.Target>
                      <UnstyledButton
                        aria-label="View character description"
                        style={{ flex: 1, minWidth: 0, textAlign: "left" }}
                      >
                        <Title order={2}>{character.name ?? "Unnamed character"}</Title>
                      </UnstyledButton>
                    </Popover.Target>
                    <Popover.Dropdown>
                      <Text
                        size="sm"
                        c={character.description?.trim() ? "dimmed" : undefined}
                        fs={character.description?.trim() ? undefined : "italic"}
                        style={{ whiteSpace: "pre-wrap" }}
                      >
                        {character.description?.trim() || "No description"}
                      </Text>
                    </Popover.Dropdown>
                  </Popover>
                  {character.featured ? (
                    <Badge size="sm" variant="light">
                      Featured
                    </Badge>
                  ) : null}
                  {isCharacterPending ? (
                    <Badge size="sm" variant="light" color="yellow">
                      Creating voice
                    </Badge>
                  ) : null}
                  {isCharacterFailed ? (
                    <Badge size="sm" variant="light" color="red">
                      Creation failed
                    </Badge>
                  ) : null}
                </Group>
              </Group>

              {isCharacterPending ? (
                <Text size="sm" c="dimmed">
                  Setting up the voice from the library. This page updates automatically.
                </Text>
              ) : null}
              {isCharacterFailed ? (
                <Text size="sm" c="red">
                  Character creation did not finish. Delete this character and try again.
                </Text>
              ) : null}
              <Group justify="space-between" wrap="nowrap" align="center">
                <Group gap="xs">
                  {character.gender ? (
                    <Badge variant="outline" size="sm">
                      {character.gender}
                    </Badge>
                  ) : null}
                  {character.language ? (
                    <Badge variant="outline" size="sm">
                      {character.language}
                    </Badge>
                  ) : null}
                  {character.accent ? (
                    <Badge variant="outline" size="sm">
                      {character.accent}
                    </Badge>
                  ) : null}
                </Group>
                {character ? (
                  <Group gap={4} wrap="nowrap">
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      aria-label="Delete character"
                      title="Delete character"
                      onClick={openDelete}
                    >
                      <RiDeleteBinLine size={18} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      aria-label="Edit character"
                      title="Edit character"
                      onClick={openDetailsEdit}
                    >
                      <RiPencilLine size={18} />
                    </ActionIcon>
                  </Group>
                ) : null}
              </Group>
              <Tabs
                defaultValue="audio"
                keepMounted={false}
                style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
                styles={{
                  panel: {
                    flex: 1,
                    minHeight: 0,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  },
                }}
              >
                <Tabs.List>
                  <Tabs.Tab value="audio">
                    <Group gap={6} wrap="nowrap">
                      Audio
                      {audioFiles.length > 0 ? (
                        <Badge size="sm" variant="light">
                          {audioFiles.length}
                        </Badge>
                      ) : null}
                    </Group>
                  </Tabs.Tab>
                  <Tabs.Tab value="images">
                    <Group gap={6} wrap="nowrap">
                      Images
                      {imageFileCount > 0 ? (
                        <Badge size="sm" variant="light">
                          {imageFileCount}
                        </Badge>
                      ) : null}
                    </Group>
                  </Tabs.Tab>
                  <Tabs.Tab value="videos">
                    <Group gap={6} wrap="nowrap">
                      Videos
                      {videoFileCount > 0 ? (
                        <Badge size="sm" variant="light">
                          {videoFileCount}
                        </Badge>
                      ) : null}
                    </Group>
                  </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="audio" pt="md">
                  <ScrollArea h="100%" type="auto" offsetScrollbars pr={!isMobile ? "xs" : 0}>
                    <CharacterAudioSection
                      audioFiles={audioFiles}
                      loading={audioFilesLoading && !isAudioPending}
                      pendingVoice={isAudioPending}
                      speechCreating={speechCreating}
                      showTitle={false}
                      onNewSpeech={openSpeechModal}
                      onDeleteFile={requestDeleteFile}
                      deletingFileId={deletingFileId}
                      onFileDeleted={handleFileDeletedFromDetail}
                    />
                  </ScrollArea>
                </Tabs.Panel>

                <Tabs.Panel value="images" pt="md">
                  {isCharacterActive ? (
                    <Group gap="xs" justify="flex-end" mb="sm">
                      <Button
                        size="compact-sm"
                        variant="light"
                        leftSection={<RiImageLine size={16} />}
                        onClick={handleOpenGenerateImages}
                      >
                        Generate images
                      </Button>
                      <Button
                        size="compact-sm"
                        variant="light"
                        leftSection={<RiEditLine size={16} />}
                        onClick={handleOpenEditImages}
                      >
                        Edit images
                      </Button>
                    </Group>
                  ) : null}
                  <Box style={{ flex: 1, minHeight: 0 }}>
                    <ScrollArea h="100%" type="auto" offsetScrollbars pr={!isMobile ? "xs" : 0}>
                      <CharacterGenerationFilesGrid
                        section="images"
                        metadata={character.metadata}
                        onDeleteFile={requestDeleteFile}
                        deletingFileId={deletingFileId}
                        onFileDeleted={handleFileDeletedFromDetail}
                      />
                    </ScrollArea>
                  </Box>
                </Tabs.Panel>

                <Tabs.Panel value="videos" pt="md">
                  {isCharacterActive ? (
                    <Group gap="xs" justify="flex-end" mb="sm">
                      <Button
                        size="compact-sm"
                        variant="light"
                        leftSection={<RiVideoLine size={16} />}
                        onClick={handleOpenGenerateVideo}
                      >
                        Generate video
                      </Button>
                      <Button
                        size="compact-sm"
                        variant="light"
                        leftSection={<RiMovie2Line size={16} />}
                        onClick={handleOpenEditVideos}
                      >
                        Edit videos
                      </Button>
                    </Group>
                  ) : null}
                  <Box style={{ flex: 1, minHeight: 0 }}>
                    <ScrollArea h="100%" type="auto" offsetScrollbars pr={!isMobile ? "xs" : 0}>
                      <CharacterGenerationFilesGrid
                        section="videos"
                        metadata={character.metadata}
                        onDeleteFile={requestDeleteFile}
                        deletingFileId={deletingFileId}
                        onFileDeleted={handleFileDeletedFromDetail}
                      />
                    </ScrollArea>
                  </Box>
                </Tabs.Panel>
              </Tabs>
            </Stack>
          ) : null}
        </Stack>
      </Box>
    </Container>
  );
}

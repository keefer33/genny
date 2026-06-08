import {
  Box,
  Button,
  Container,
  Group,
  Loader,
  Modal,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { RiAddLine, RiBookOpenLine, RiFileCopyLine, RiMicLine } from "@remixicon/react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import useAppStore from "~/lib/stores/appStore";
import useVoicesStore, { type UserVoice } from "~/lib/stores/voicesStore";
import type { SharedVoiceItem } from "~/lib/voices/voiceLibraryQuery";
import {
  buildSharedVoiceCloneMetadata,
  mapSharedVoiceLanguageToClone,
} from "~/lib/voices/sharedVoiceUtils";
import { AddMediaZone } from "~/pages/generate/components/x-ui-components/MediaFilePicker/AddMediaZone";
import { DesignVoiceModal } from "~/pages/voices/components/DesignVoiceModal";
import { EditVoiceModal } from "~/pages/voices/components/EditVoiceModal";
import { VoiceCard } from "~/pages/voices/components/VoiceCard";
import {
  VOICE_ACCENT_OPTIONS,
  VOICE_AGE_OPTIONS,
  VOICE_GENDER_OPTIONS,
} from "~/pages/voices/voiceFormOptions";
import { VoiceLibraryPicker } from "~/shared/VoiceLibraryPicker";

export function meta() {
  return [{ title: "Voices" }];
}

export default function Voices() {
  const userId = useAppStore((s) => s.getUser()?.user?.id ?? "");
  const isMobile = useAppStore((s) => s.isMobile);
  const navigate = useNavigate();
  const [designOpened, { open: openDesign, close: closeDesign }] = useDisclosure(false);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [cloneOpened, { open: openClone, close: closeClone }] = useDisclosure(false);
  const [libraryOpened, { open: openLibrary, close: closeLibrary }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [editingVoice, setEditingVoice] = useState<UserVoice | null>(null);
  const [cloningVoice, setCloningVoice] = useState<UserVoice | null>(null);
  const [deletingVoice, setDeletingVoice] = useState<UserVoice | null>(null);
  const [cloneName, setCloneName] = useState("");
  const [cloneAudioUrl, setCloneAudioUrl] = useState("");
  const [cloneDescription, setCloneDescription] = useState("");
  const [cloneGender, setCloneGender] = useState<string | null>(null);
  const [cloneAge, setCloneAge] = useState<string | null>(null);
  const [cloneAccent, setCloneAccent] = useState<string | null>(null);

  const {
    userVoices,
    userVoicesLoading,
    cloneLoading,
    updateLoading,
    deleteLoading,
    loadUserVoices,
    cloneVoice,
    updateVoice,
    deleteVoice,
  } = useVoicesStore();

  const refresh = () => {
    if (!userId) return;
    void loadUserVoices(userId);
  };

  const resetCloneModal = () => {
    closeClone();
    setCloningVoice(null);
    setCloneName("");
    setCloneAudioUrl("");
    setCloneDescription("");
    setCloneGender(null);
    setCloneAge(null);
    setCloneAccent(null);
  };

  useEffect(() => {
    refresh();
  }, [userId]);

  useEffect(() => {
    if (!cloneOpened || !cloningVoice) return;
    setCloneName(`${cloningVoice.name?.trim() || "Untitled voice"} (Clone)`);
    setCloneDescription(cloningVoice.description?.trim() || "");
    setCloneGender(cloningVoice.gender?.trim() || null);
    setCloneAge(cloningVoice.age?.trim() || null);
    setCloneAccent(cloningVoice.accent?.trim() || null);
    setCloneAudioUrl(cloningVoice.files?.[0]?.file_path?.trim() || "");
  }, [cloneOpened, cloningVoice]);

  const handleCloneFromLibrary = async (voice: SharedVoiceItem) => {
    const previewUrl = voice.preview_url?.trim();
    if (!previewUrl) return;

    const voiceName = (voice.name ?? "").trim() || voice.voice_id;
    const cloned = await cloneVoice({
      audio: previewUrl,
      name: voiceName,
      language: mapSharedVoiceLanguageToClone(voice.language),
      description: voice.description?.trim() || undefined,
      gender: voice.gender?.trim() || undefined,
      age: voice.age?.trim() || undefined,
      accent: voice.accent?.trim() || undefined,
      metadata: buildSharedVoiceCloneMetadata(voice),
    });
    if (cloned?.id) {
      closeLibrary();
      refresh();
    }
  };

  const existingLibraryVoiceIds = useMemo(() => {
    const ids = new Set<string>();
    for (const voice of userVoices) {
      const meta = voice.metadata;
      if (!meta || typeof meta !== "object" || Array.isArray(meta)) continue;
      const clone = (meta as { clone?: { voice_id?: unknown } }).clone;
      const sourceId = typeof clone?.voice_id === "string" ? clone.voice_id.trim() : "";
      if (sourceId) ids.add(sourceId);
    }
    return ids;
  }, [userVoices]);

  return (
    <Container size="lg" py="md" px={isMobile ? "sm" : "md"}>
      <Stack gap="xl">
        <Group justify="space-between" align="flex-end" wrap="wrap">
          <Stack gap={4}>
            <Title order={2}>Voices</Title>
          </Stack>
          <Group gap="xs" align="center">
            <Button
              variant="default"
              leftSection={<RiBookOpenLine size={18} />}
              size="sm"
              onClick={openLibrary}
            >
              Library
            </Button>
            <Button leftSection={<RiAddLine size={18} />} onClick={openDesign} size="sm">
              Design
            </Button>
            <Button leftSection={<RiFileCopyLine size={18} />} onClick={openClone} size="sm">
              Clone
            </Button>
          </Group>
        </Group>

        <DesignVoiceModal opened={designOpened} onClose={closeDesign} onPublished={refresh} />

        <Modal
          opened={libraryOpened}
          onClose={() => {
            if (cloneLoading) return;
            closeLibrary();
          }}
          title="Voice library"
          centered
          size="xl"
        >
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              Browse the shared voice library and clone a voice into your account.
            </Text>
            <VoiceLibraryPicker
              active={libraryOpened}
              onPick={handleCloneFromLibrary}
              pickDisabled={cloneLoading}
              pickButtonLabel="Clone"
              existingVoiceIds={existingLibraryVoiceIds}
              scrollHeight={360}
            />
            <Group justify="flex-end">
              <Button variant="default" onClick={closeLibrary} disabled={cloneLoading}>
                Close
              </Button>
            </Group>
          </Stack>
        </Modal>

        <EditVoiceModal
          opened={editOpened}
          voice={editingVoice}
          submitting={updateLoading}
          onClose={() => {
            closeEdit();
            setEditingVoice(null);
          }}
          onSubmit={async (values) => {
            if (!editingVoice?.id) return;
            const ok = await updateVoice(editingVoice.id, values);
            if (ok) {
              closeEdit();
              setEditingVoice(null);
              refresh();
            }
          }}
        />

        <Modal
          opened={cloneOpened}
          onClose={() => {
            if (cloneLoading) return;
            resetCloneModal();
          }}
          title="Clone voice"
          centered
          size="md"
        >
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              Select an audio sample from your files to clone a voice into your library.
            </Text>
            <TextInput
              label="Name"
              placeholder="Voice name"
              value={cloneName}
              onChange={(event) => setCloneName(event.currentTarget.value)}
              required
              disabled={cloneLoading}
            />
            <Stack gap={6}>
              <Text size="sm" fw={500}>
                Audio sample
              </Text>
              {!cloneLoading ? (
                <AddMediaZone
                  selectLabel="Select audio sample"
                  modalTitle="Select audio sample"
                  allowedTypes="audio"
                  onPickPath={(path) => setCloneAudioUrl(path.trim())}
                  onAddUrl={(url) => setCloneAudioUrl(url.trim())}
                />
              ) : null}
              <Text size="sm" c={cloneAudioUrl.trim() ? "dimmed" : "red"}>
                {cloneAudioUrl.trim() || "No audio file selected"}
              </Text>
            </Stack>
            <Textarea
              label="Description"
              placeholder="Optional"
              minRows={2}
              maxRows={6}
              autosize
              value={cloneDescription}
              onChange={(event) => setCloneDescription(event.currentTarget.value)}
              disabled={cloneLoading}
            />
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
              <Select
                label="Gender"
                placeholder="Optional"
                clearable
                data={[...VOICE_GENDER_OPTIONS]}
                value={cloneGender}
                onChange={(value) => setCloneGender(typeof value === "string" ? value : null)}
                disabled={cloneLoading}
              />
              <Select
                label="Age"
                placeholder="Optional"
                clearable
                data={[...VOICE_AGE_OPTIONS]}
                value={cloneAge}
                onChange={(value) => setCloneAge(typeof value === "string" ? value : null)}
                disabled={cloneLoading}
              />
              <Select
                label="Accent"
                placeholder="Optional"
                clearable
                searchable
                data={VOICE_ACCENT_OPTIONS}
                value={cloneAccent}
                onChange={(value) => setCloneAccent(typeof value === "string" ? value : null)}
                disabled={cloneLoading}
              />
            </SimpleGrid>
            <Group justify="flex-end" gap="xs">
              <Button variant="default" onClick={resetCloneModal} disabled={cloneLoading}>
                Cancel
              </Button>
              <Button
                loading={cloneLoading}
                disabled={!cloneName.trim() || !cloneAudioUrl.trim()}
                onClick={async () => {
                  const cloned = await cloneVoice({
                    name: cloneName,
                    audio: cloneAudioUrl,
                    description: cloneDescription,
                    gender: cloneGender,
                    age: cloneAge,
                    accent: cloneAccent,
                    language: "EN_US",
                  });
                  if (!cloned?.id) return;
                  resetCloneModal();
                  refresh();
                }}
              >
                Clone voice
              </Button>
            </Group>
          </Stack>
        </Modal>

        <Modal
          opened={deleteOpened}
          onClose={() => {
            if (deleteLoading) return;
            closeDelete();
            setDeletingVoice(null);
          }}
          title="Delete voice?"
          centered
        >
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              {deletingVoice?.name
                ? `Remove "${deletingVoice.name}" from your library? This also deletes the voice in Inworld when linked. This cannot be undone.`
                : "Remove this voice from your library? This cannot be undone."}
            </Text>
            <Group justify="flex-end" gap="xs">
              <Button
                variant="default"
                onClick={() => {
                  closeDelete();
                  setDeletingVoice(null);
                }}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                color="red"
                loading={deleteLoading}
                onClick={async () => {
                  if (!deletingVoice?.id) return;
                  const ok = await deleteVoice(deletingVoice.id);
                  if (ok) {
                    closeDelete();
                    setDeletingVoice(null);
                    refresh();
                  }
                }}
              >
                Delete
              </Button>
            </Group>
          </Stack>
        </Modal>

        <Stack gap="md">
          <Group gap="xs">
            <RiMicLine size={20} />
            <Title order={4}>Your voices</Title>
          </Group>
          {userVoicesLoading && userVoices.length === 0 ? (
            <Group justify="center" py="lg">
              <Loader size="sm" />
            </Group>
          ) : userVoices.length === 0 ? (
            <Box py="md">
              <Text c="dimmed" size="sm">
                You have not saved any voices yet. Use Design voice to create one from a text
                description, or open the{" "}
                <Text
                  component="button"
                  type="button"
                  span
                  c="blue"
                  inherit
                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                  onClick={openLibrary}
                >
                  voice library
                </Text>{" "}
                to clone one.
              </Text>
            </Box>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
              {userVoices.map((voice) => (
                <VoiceCard
                  key={voice.id}
                  voice={voice}
                  onOpen={(v) => navigate(`/voices/${encodeURIComponent(v.id)}`)}
                  onEdit={(v) => {
                    setEditingVoice(v);
                    openEdit();
                  }}
                  onClone={(v) => {
                    setCloningVoice(v);
                    openClone();
                  }}
                  onDelete={(v) => {
                    setDeletingVoice(v);
                    openDelete();
                  }}
                />
              ))}
            </SimpleGrid>
          )}
        </Stack>
      </Stack>
    </Container>
  );
}

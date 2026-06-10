import {
  Button,
  Group,
  Modal,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { RiFileCopyLine } from "@remixicon/react";
import { useEffect } from "react";
import useVoicesStore from "~/lib/stores/voicesStore";
import { AddMediaZone } from "~/pages/generate/components/x-ui-components/MediaFilePicker/AddMediaZone";
import {
  VOICE_ACCENT_OPTIONS,
  VOICE_AGE_OPTIONS,
  VOICE_GENDER_OPTIONS,
} from "~/pages/voices/voiceFormOptions";
import useAppStore from "~/lib/stores/appStore";

type CloneVoiceFormValues = {
  name: string;
  audioUrl: string;
  description: string;
  gender: string | null;
  age: string | null;
  accent: string | null;
};

const emptyValues: CloneVoiceFormValues = {
  name: "",
  audioUrl: "",
  description: "",
  gender: null,
  age: null,
  accent: null,
};

export function ModalVoiceClone() {
  const {
    cloneVoiceOpened,
    openCloneVoice,
    closeCloneVoice,
    cloneVoice,
    cloneLoading,
    loadUserVoices,
  } = useVoicesStore();
  const { isMobile } = useAppStore();
  const form = useForm<CloneVoiceFormValues>({
    initialValues: emptyValues,
    validate: {
      name: (value) => (!value.trim() ? "Name is required" : null),
      audioUrl: (value) => (!value.trim() ? "Audio sample is required" : null),
    },
  });

  useEffect(() => {
    if (!cloneVoiceOpened) return;
    form.setValues(emptyValues);
    form.resetDirty();
  }, [cloneVoiceOpened]);

  const handleClose = () => {
    if (cloneLoading) return;
    closeCloneVoice();
    form.reset();
  };

  const handleSubmit = form.onSubmit(async (values) => {
    const cloned = await cloneVoice({
      name: values.name.trim(),
      audio: values.audioUrl.trim(),
      description: values.description.trim(),
      gender: values.gender,
      age: values.age,
      accent: values.accent,
      language: "EN_US",
    });
    if (!cloned?.id) return;
    await loadUserVoices({ page: 1, paginate: true });
    handleClose();
  });

  return (
    <>
      <Button
        variant="filled"
        leftSection={<RiFileCopyLine size={18} />}
        size="compact-sm"
        onClick={openCloneVoice}
      >
        Clone
      </Button>
      <Modal
        opened={cloneVoiceOpened}
        onClose={handleClose}
        title="Clone voice"
        centered
        size="md"
        fullScreen={isMobile}
      >
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              Pick an audio sample from your files to clone a new voice into your library.
            </Text>
            <TextInput
              label="Name"
              placeholder="Voice name"
              required
              disabled={cloneLoading}
              {...form.getInputProps("name")}
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
                  onPickPath={(path) => form.setFieldValue("audioUrl", path.trim())}
                  onAddUrl={(url) => form.setFieldValue("audioUrl", url.trim())}
                />
              ) : null}
              <Text size="sm" c={form.values.audioUrl.trim() ? "dimmed" : "red"}>
                {form.values.audioUrl.trim() || "No audio file selected"}
              </Text>
            </Stack>
            <Textarea
              label="Description"
              placeholder="Optional"
              minRows={2}
              maxRows={6}
              autosize
              disabled={cloneLoading}
              {...form.getInputProps("description")}
            />
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
              <Select
                label="Gender"
                placeholder="Optional"
                clearable
                data={[...VOICE_GENDER_OPTIONS]}
                disabled={cloneLoading}
                {...form.getInputProps("gender")}
              />
              <Select
                label="Age"
                placeholder="Optional"
                clearable
                data={[...VOICE_AGE_OPTIONS]}
                disabled={cloneLoading}
                {...form.getInputProps("age")}
              />
              <Select
                label="Accent"
                placeholder="Optional"
                clearable
                searchable
                data={VOICE_ACCENT_OPTIONS}
                disabled={cloneLoading}
                {...form.getInputProps("accent")}
              />
            </SimpleGrid>
            <Group justify="flex-end" gap="xs">
              <Button variant="default" onClick={handleClose} disabled={cloneLoading} type="button">
                Cancel
              </Button>
              <Button
                type="submit"
                loading={cloneLoading}
                disabled={!form.values.name.trim() || !form.values.audioUrl.trim()}
              >
                Clone voice
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}

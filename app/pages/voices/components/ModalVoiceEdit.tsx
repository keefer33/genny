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
import { useEffect } from "react";
import useVoicesStore from "~/lib/stores/voicesStore";
import {
  VOICE_ACCENT_OPTIONS,
  VOICE_AGE_OPTIONS,
  VOICE_GENDER_OPTIONS,
} from "~/pages/voices/voiceFormOptions";

const MAX_NAME_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 2000;

type VoiceEditFormValues = {
  name: string;
  description: string;
  gender: string | null;
  age: string | null;
  accent: string | null;
};

const emptyValues: VoiceEditFormValues = {
  name: "",
  description: "",
  gender: null,
  age: null,
  accent: null,
};

export function ModalVoiceEdit() {
  const {
    editVoiceOpened,
    closeEditVoice,
    updateVoice,
    updateLoading,
    loadUserVoices,
    selectedVoice,
    setSelectedVoice,
  } = useVoicesStore();

  const form = useForm<VoiceEditFormValues>({
    initialValues: emptyValues,
    validate: {
      name: (value) => (!value.trim() ? "Name is required" : null),
    },
  });

  useEffect(() => {
    if (!editVoiceOpened || !selectedVoice) return;
    form.setValues({
      name: selectedVoice.name?.trim() ?? "",
      description: selectedVoice.description?.trim() ?? "",
      gender: selectedVoice.gender?.trim() || null,
      age: selectedVoice.age?.trim() || null,
      accent: selectedVoice.accent?.trim() || null,
    });
    form.resetDirty();
  }, [editVoiceOpened, selectedVoice]);

  const handleClose = () => {
    closeEditVoice();
    form.reset();
  };

  const handleSubmit = form.onSubmit(async (values) => {
    const voiceId = selectedVoice?.id?.trim();
    if (!voiceId) return;

    const ok = await updateVoice(voiceId, {
      name: values.name.trim(),
      description: values.description.trim(),
      gender: values.gender,
      age: values.age,
      accent: values.accent,
    });
    if (ok) {
      await loadUserVoices();
      const updated = useVoicesStore.getState().userVoices.find((row) => row.id === voiceId);
      if (updated) setSelectedVoice(updated);
      handleClose();
    }
  });

  return (
    <Modal opened={editVoiceOpened} onClose={handleClose} title="Edit voice" centered size="md">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Name, description, and gender sync to Inworld. Age and accent are saved in your Genny
            library only.
          </Text>
          <TextInput
            label="Name"
            maxLength={MAX_NAME_LENGTH}
            disabled={updateLoading}
            required
            {...form.getInputProps("name")}
          />
          <Textarea
            label="Description"
            minRows={3}
            maxRows={8}
            autosize
            maxLength={MAX_DESCRIPTION_LENGTH}
            disabled={updateLoading}
            {...form.getInputProps("description")}
          />
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
            <Select
              label="Gender"
              placeholder="Optional"
              clearable
              data={[...VOICE_GENDER_OPTIONS]}
              disabled={updateLoading}
              {...form.getInputProps("gender")}
            />
            <Select
              label="Age"
              placeholder="Optional"
              clearable
              data={[...VOICE_AGE_OPTIONS]}
              disabled={updateLoading}
              {...form.getInputProps("age")}
            />
            <Select
              label="Accent"
              placeholder="Optional"
              clearable
              searchable
              data={VOICE_ACCENT_OPTIONS}
              disabled={updateLoading}
              {...form.getInputProps("accent")}
            />
          </SimpleGrid>
          <Group justify="flex-end" gap="xs">
            <Button variant="default" onClick={handleClose} disabled={updateLoading} type="button">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!form.values.name.trim() || updateLoading}
              loading={updateLoading}
            >
              Save
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

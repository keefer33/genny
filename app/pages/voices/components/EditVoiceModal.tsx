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
import { useEffect, useState } from "react";
import type { UserVoice } from "~/lib/stores/voicesStore";
import {
  VOICE_ACCENT_OPTIONS,
  VOICE_AGE_OPTIONS,
  VOICE_GENDER_OPTIONS,
} from "~/pages/voices/voiceFormOptions";

const MAX_NAME_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 2000;

type EditVoiceModalProps = {
  opened: boolean;
  voice: UserVoice | null;
  onClose: () => void;
  submitting?: boolean;
  onSubmit: (values: {
    name: string;
    description: string;
    gender: string | null;
    age: string | null;
    accent: string | null;
  }) => void;
};

export function EditVoiceModal({
  opened,
  voice,
  onClose,
  submitting = false,
  onSubmit,
}: EditVoiceModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [gender, setGender] = useState<string | null>(null);
  const [age, setAge] = useState<string | null>(null);
  const [accent, setAccent] = useState<string | null>(null);

  useEffect(() => {
    if (!opened || !voice) return;
    setName(voice.name?.trim() ?? "");
    setDescription(voice.description?.trim() ?? "");
    setGender(voice.gender?.trim() || null);
    setAge(voice.age?.trim() || null);
    setAccent(voice.accent?.trim() || null);
  }, [opened, voice]);

  const trimmedName = name.trim();

  return (
    <Modal opened={opened} onClose={onClose} title="Edit voice" centered size="md">
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Name, description, and gender sync to Inworld. Age and accent are saved in your Genny
          library only.
        </Text>
        <TextInput
          label="Name"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          maxLength={MAX_NAME_LENGTH}
          disabled={submitting}
          required
        />
        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
          minRows={3}
          maxRows={8}
          autosize
          maxLength={MAX_DESCRIPTION_LENGTH}
          disabled={submitting}
        />
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
          <Select
            label="Gender"
            placeholder="Optional"
            clearable
            data={[...VOICE_GENDER_OPTIONS]}
            value={gender}
            onChange={(value) => setGender(value)}
            disabled={submitting}
          />
          <Select
            label="Age"
            placeholder="Optional"
            clearable
            data={[...VOICE_AGE_OPTIONS]}
            value={age}
            onChange={(value) => setAge(value)}
            disabled={submitting}
          />
          <Select
            label="Accent"
            placeholder="Optional"
            clearable
            searchable
            data={VOICE_ACCENT_OPTIONS}
            value={accent}
            onChange={(value) => setAccent(value)}
            disabled={submitting}
          />
        </SimpleGrid>
        <Group justify="flex-end" gap="xs">
          <Button variant="default" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            disabled={!trimmedName || submitting}
            loading={submitting}
            onClick={() =>
              onSubmit({
                name: trimmedName,
                description: description.trim(),
                gender,
                age,
                accent,
              })
            }
          >
            Save
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

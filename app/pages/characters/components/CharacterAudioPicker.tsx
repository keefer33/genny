import { Box, Card, Group, Input, Select, Stack, Text } from "@mantine/core";
import { RiSoundModuleLine } from "@remixicon/react";
import { useMemo } from "react";
import { useFormContext } from "~/lib/ContextForm";
import type { UserVoice, UserVoiceSpeech } from "~/lib/stores/voicesStore";
import { CHARACTER_GENERATE_LOOK_CHARACTER_AUDIO_FIELD } from "~/pages/characters/characterGenerateLookSchema";
import { GennyAudioPlayer } from "~/shared/GennyAudioPlayer";
import { speechAudioUrl, voicePreviewUrl } from "~/pages/voices/voiceUtils";

export type AudioPickerOption = {
  value: string;
  label: string;
};

export function buildAudioPickerOptions(
  speeches: UserVoiceSpeech[],
  voice?: UserVoice | null
): AudioPickerOption[] {
  const options: AudioPickerOption[] = [];
  const seen = new Set<string>();

  const add = (key: string, url: string, label: string) => {
    const value = url.trim();
    if (!value || seen.has(key)) return;
    seen.add(key);
    options.push({ value, label });
  };

  const defaultVoiceUrl = voice ? voicePreviewUrl(voice) : null;
  if (defaultVoiceUrl) {
    const voiceName = voice?.name?.trim();
    add(
      "voice-preview",
      defaultVoiceUrl,
      voiceName ? `${voiceName} (voice preview)` : "Voice preview"
    );
  }

  for (const speech of speeches) {
    const speechId = speech.id?.trim();
    const url = speechAudioUrl(speech, voice);
    if (!speechId || !url) continue;
    add(speechId, url, speech.title?.trim() || "Untitled speech");
  }

  return options;
}

type CharacterAudioPickerProps = {
  options: AudioPickerOption[];
  disabled?: boolean;
};

export function CharacterAudioPicker({ options, disabled = false }: CharacterAudioPickerProps) {
  const form = useFormContext();
  const value =
    typeof form.values[CHARACTER_GENERATE_LOOK_CHARACTER_AUDIO_FIELD] === "string"
      ? form.values[CHARACTER_GENERATE_LOOK_CHARACTER_AUDIO_FIELD]
      : "";

  const selectData = useMemo(
    () => options.map((o) => ({ value: o.value, label: o.label })),
    [options]
  );

  const selected = options.find((o) => o.value === value);

  if (selectData.length === 0) {
    return (
      <Input.Wrapper label="Audio reference">
        <Text size="sm" c="dimmed" mt={4}>
          No audio available. Assign a voice with preview audio or generate speech for this
          character.
        </Text>
      </Input.Wrapper>
    );
  }

  return (
    <Card>
      <Stack gap="xs">
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Box>
            <Text size="sm" fw={500}>
              Audio reference
            </Text>
            <Text size="sm" c="dimmed">
              Voice preview or speech clip used when generating.
            </Text>
          </Box>
          <Select
            data={selectData}
            placeholder="Choose audio"
            value={value || null}
            onChange={(next) => {
              if (next) form.setFieldValue(CHARACTER_GENERATE_LOOK_CHARACTER_AUDIO_FIELD, next);
            }}
            allowDeselect={false}
            disabled={disabled}
          />
        </Box>
        <Box style={{ flexShrink: 0 }}>
          {selected?.value ? (
            <GennyAudioPlayer src={selected.value} compact />
          ) : (
            <Group gap="xs" c="dimmed">
              <RiSoundModuleLine size={20} />
              <Text size="sm">Select audio</Text>
            </Group>
          )}
        </Box>
      </Stack>
    </Card>
  );
}

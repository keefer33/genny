import { Select, SimpleGrid, Stack, TextInput, Textarea } from "@mantine/core";
import {
  CHARACTER_AGE_OPTIONS,
  CHARACTER_DESCRIPTION_MIN,
  CHARACTER_GENDER_OPTIONS,
  MAX_CHARACTER_DESCRIPTION_LENGTH,
  MAX_CHARACTER_ETHNICITY_LENGTH,
  MAX_CHARACTER_NAME_LENGTH,
} from "~/pages/characters/characterUtils";

type CharacterFormFieldsProps = {
  name: string;
  description: string;
  gender: string | null;
  age: string | null;
  ethnicity: string;
  disabled?: boolean;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onGenderChange: (value: string | null) => void;
  onAgeChange: (value: string | null) => void;
  onEthnicityChange: (value: string) => void;
};

export function CharacterFormFields({
  name,
  description,
  gender,
  age,
  ethnicity,
  disabled = false,
  onNameChange,
  onDescriptionChange,
  onGenderChange,
  onAgeChange,
  onEthnicityChange,
}: CharacterFormFieldsProps) {
  return (
    <Stack gap="md">
      <TextInput
        label="Name"
        value={name}
        onChange={(e) => onNameChange(e.currentTarget.value)}
        maxLength={MAX_CHARACTER_NAME_LENGTH}
        disabled={disabled}
        required
      />
      <Textarea
        label="Description"
        description={`${description.trim().length}/${MAX_CHARACTER_DESCRIPTION_LENGTH} characters (min ${CHARACTER_DESCRIPTION_MIN} for AI assist) — include height, build, skin tone, hair, eyes, face, clothing, and distinctive marks.`}
        value={description}
        onChange={(e) => onDescriptionChange(e.currentTarget.value)}
        minRows={4}
        maxRows={10}
        autosize
        maxLength={MAX_CHARACTER_DESCRIPTION_LENGTH}
        disabled={disabled}
        required
      />
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
        <Select
          label="Gender"
          placeholder="Optional"
          clearable
          data={[...CHARACTER_GENDER_OPTIONS]}
          value={gender}
          onChange={(value) => onGenderChange(value)}
          disabled={disabled}
        />
        <Select
          label="Age"
          placeholder="Optional"
          clearable
          data={[...CHARACTER_AGE_OPTIONS]}
          value={age}
          onChange={(value) => onAgeChange(value)}
          disabled={disabled}
        />
        <TextInput
          label="Ethnicity"
          placeholder="Optional"
          value={ethnicity}
          onChange={(e) => onEthnicityChange(e.currentTarget.value)}
          maxLength={MAX_CHARACTER_ETHNICITY_LENGTH}
          disabled={disabled}
        />
      </SimpleGrid>
    </Stack>
  );
}

import { ActionIcon, Group, Image, Stack, Text } from "@mantine/core";
import { RiCloseLine } from "@remixicon/react";
import { AddMediaZone } from "~/pages/generate/components/x-ui-components/MediaFilePicker/AddMediaZone";

type CharacterReferenceImagePickerProps = {
  value: string;
  disabled?: boolean;
  onChange: (url: string) => void;
};

export function CharacterReferenceImagePicker({
  value,
  disabled = false,
  onChange,
}: CharacterReferenceImagePickerProps) {
  const trimmed = value.trim();

  return (
    <Stack gap={6}>
      <Text size="sm" fw={500}>
        Reference image
      </Text>
      <Text size="xs" c="dimmed">
        Optional. Use a photo to guide the initial look generation.
      </Text>
      {trimmed ? (
        <Group gap="sm" wrap="nowrap" align="flex-start">
          <Image
            src={trimmed}
            alt="Character reference"
            w={80}
            h={80}
            radius="sm"
            fit="cover"
          />
          <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
            <Text size="xs" c="dimmed" lineClamp={2} title={trimmed}>
              {trimmed}
            </Text>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              aria-label="Clear reference image"
              disabled={disabled}
              onClick={() => onChange("")}
            >
              <RiCloseLine size={16} />
            </ActionIcon>
          </Stack>
        </Group>
      ) : !disabled ? (
        <AddMediaZone
          selectLabel="Select reference image"
          modalTitle="Select reference image"
          allowedTypes="images"
          onPickPath={(path) => onChange(path.trim())}
          onAddUrl={(url) => onChange(url.trim())}
        />
      ) : (
        <Text size="sm" c="dimmed">
          No reference image selected
        </Text>
      )}
    </Stack>
  );
}

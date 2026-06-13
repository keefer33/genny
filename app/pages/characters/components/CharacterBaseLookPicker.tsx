import { Box, Card, Group, Image, Input, Select, Stack, Text } from "@mantine/core";
import { useMemo } from "react";
import { useFormContext } from "~/lib/ContextForm";
import { CHARACTER_GENERATE_LOOK_BASE_IMAGE_FIELD } from "~/pages/characters/characterGenerateLookSchema";
import {
  characterMemberFileGenerationUrl,
  characterMemberFileThumbnailUrl,
} from "~/pages/characters/characterUtils";
import type { CharacterLook } from "~/pages/characters/characterLookTypes";
import type { CharacterScene } from "~/pages/characters/characterSceneGenerationUtils";

export type BaseLookPickerOption = {
  value: string;
  label: string;
  thumbnailUrl?: string;
};

export function buildBaseLookPickerOptionsFromLooks(
  looks: CharacterLook[]
): BaseLookPickerOption[] {
  const options: BaseLookPickerOption[] = [];
  const seen = new Set<string>();

  const sortedLooks = [...looks].sort((a, b) => {
    if (a.base_look && !b.base_look) return -1;
    if (!a.base_look && b.base_look) return 1;
    return (a.created_at ?? "").localeCompare(b.created_at ?? "");
  });

  for (const look of sortedLooks) {
    const frontItem = look.items.find((item) => (item.view ?? "").trim().toLowerCase() === "front");
    const file = frontItem?.file;
    if (!file?.id) continue;

    const memberFile = {
      id: file.id,
      file_name: file.file_name?.trim() || look.name?.trim() || "Look",
      file_path: file.file_path?.trim() || "",
      file_size: file.file_size ?? 0,
      file_type: file.file_type?.trim() || "image/png",
      created_at: file.created_at ?? "",
      thumbnail_url: file.thumbnail_url?.trim() || undefined,
      upload_type: file.upload_type,
    };

    const generationUrl = characterMemberFileGenerationUrl(memberFile);
    if (!generationUrl || seen.has(generationUrl)) continue;
    seen.add(generationUrl);

    const name = look.name?.trim() || "Look";
    options.push({
      value: generationUrl,
      label: look.base_look ? `${name} (base)` : name,
      thumbnailUrl: characterMemberFileThumbnailUrl(memberFile),
    });
  }

  return options;
}

export function buildBaseLookPickerOptionsFromScenes(
  scenes: CharacterScene[]
): BaseLookPickerOption[] {
  const options: BaseLookPickerOption[] = [];
  const seen = new Set<string>();

  const sortedScenes = [...scenes].sort((a, b) =>
    (b.created_at ?? "").localeCompare(a.created_at ?? "")
  );

  for (const scene of sortedScenes) {
    const file = scene.file;
    if (!file?.id) continue;

    const memberFile = {
      id: file.id,
      file_name: file.file_name?.trim() || scene.name?.trim() || "Scene",
      file_path: file.file_path?.trim() || "",
      file_size: file.file_size ?? 0,
      file_type: file.file_type?.trim() || "image/png",
      created_at: file.created_at ?? "",
      thumbnail_url: file.thumbnail_url?.trim() || undefined,
      upload_type: file.upload_type,
    };

    const generationUrl = characterMemberFileGenerationUrl(memberFile);
    if (!generationUrl || seen.has(generationUrl)) continue;
    seen.add(generationUrl);

    const name = scene.name?.trim() || "Scene";
    options.push({
      value: generationUrl,
      label: `${name} (scene)`,
      thumbnailUrl: characterMemberFileThumbnailUrl(memberFile),
    });
  }

  return options;
}

export function buildBaseLookPickerOptionsForVideo(
  looks: CharacterLook[],
  scenes: CharacterScene[]
): BaseLookPickerOption[] {
  const lookOptions = buildBaseLookPickerOptionsFromLooks(looks);
  const seen = new Set(lookOptions.map((option) => option.value));
  const merged = [...lookOptions];

  for (const option of buildBaseLookPickerOptionsFromScenes(scenes)) {
    if (seen.has(option.value)) continue;
    seen.add(option.value);
    merged.push(option);
  }

  return merged;
}

type CharacterBaseLookPickerProps = {
  options: BaseLookPickerOption[];
  disabled?: boolean;
  /** When true, copy reflects looks + scenes (video generation). */
  includesScenes?: boolean;
};

export function CharacterBaseLookPicker({
  options,
  disabled = false,
  includesScenes = false,
}: CharacterBaseLookPickerProps) {
  const form = useFormContext();
  const value =
    typeof form.values[CHARACTER_GENERATE_LOOK_BASE_IMAGE_FIELD] === "string"
      ? form.values[CHARACTER_GENERATE_LOOK_BASE_IMAGE_FIELD]
      : "";

  const selectData = useMemo(
    () => options.map((o) => ({ value: o.value, label: "Switch Look" })),
    [options]
  );

  const selected = options.find((o) => o.value === value);

  if (selectData.length === 0) {
    return (
      <Input.Wrapper label={includesScenes ? "Image reference" : "Base look reference"}>
        <Text size="sm" c="dimmed" mt={4}>
          {includesScenes
            ? "No look or scene images available for this character yet."
            : "No look images available for this character yet."}
        </Text>
      </Input.Wrapper>
    );
  }

  return (
    <Card>
      <Stack gap="xs">
        <Group gap="xl" wrap="nowrap">
          <Box>
            {selected?.thumbnailUrl ? (
              <Image
                src={selected.thumbnailUrl}
                alt={selected.label}
                w={100}
                h={100}
                style={{ objectFit: "cover", objectPosition: "top" }}
                radius="md"
              />
            ) : null}
          </Box>
          <Box>
            <Box pb="md">
              <Text size="sm" fw={500}>
                {includesScenes ? "Image reference" : "Look reference"}
              </Text>
              <Text size="sm" c="dimmed">
                {includesScenes
                  ? "Choose a look or scene as the visual reference."
                  : "First image when generating."}
              </Text>
            </Box>
            <Select
              data={selectData}
              placeholder="Switch Look"
              value={value || null}
              onChange={(next) => {
                if (next) form.setFieldValue(CHARACTER_GENERATE_LOOK_BASE_IMAGE_FIELD, next);
              }}
              allowDeselect={false}
              disabled={disabled}
              renderOption={({ option }) => {
                const opt = options.find((o) => o.value === option.value);
                return (
                  <Group gap="sm" wrap="nowrap">
                    {opt?.thumbnailUrl ? (
                      <Image
                        src={opt.thumbnailUrl}
                        alt=""
                        w={100}
                        h={100}
                        fit="cover"
                        radius="sm"
                      />
                    ) : null}
                  </Group>
                );
              }}
            />
          </Box>
        </Group>
      </Stack>
    </Card>
  );
}

import { ActionIcon, Box, Group, Input, Stack, Text, TextInput } from "@mantine/core";
import { useEffect, useState } from "react";
import { RiCloseLine } from "@remixicon/react";
import { useFormContext } from "~/lib/ContextForm";
import type { FileTypeFilter } from "~/lib/stores/filesFoldersStore";
import type { PlaygroundMediaFilePickerInputProps } from "~/types/generations";
import { AddMediaZone } from "./AddMediaZone";
import { ManualUrlRow } from "./ManualUrlRow";
import { PickerMediaRow } from "./PickerMediaRow";

export type MediaFilePickerSource = "picker" | "addUrl";

export type MediaFilePickerFileEntry = {
  url: string;
  type: MediaFilePickerSource;
};

function getAllowedTypesFromXUi(xUi: unknown): unknown {
  if (!xUi || typeof xUi !== "object" || Array.isArray(xUi)) return undefined;
  const settings = (xUi as Record<string, unknown>).settings;
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return undefined;
  const s = settings as Record<string, unknown>;
  return s.allowed_types ?? s.allowedTypes ?? s.allowed_file_types;
}

function allowedFileTypesToPickerTypes(raw: unknown): FileTypeFilter {
  const values =
    typeof raw === "string" && raw.trim()
      ? [raw]
      : Array.isArray(raw) && raw.length > 0
        ? raw.map((x) => String(x))
        : [];
  if (values.length === 0) return "all";

  const tokens = values
    .flatMap((value) => value.toLowerCase().split(/\band\b|[\s,|/+]+/g))
    .map((x) => x.trim())
    .filter(Boolean);

  if (tokens.includes("all") || tokens.includes("*")) return "all";

  const hasImage = tokens.some((x) => x === "image" || x === "images");
  const hasVideo = tokens.some((x) => x === "video" || x === "videos");
  const hasAudio = tokens.some(
    (x) => x === "audio" || x === "audios" || x === "sound" || x === "sounds"
  );
  if (hasImage && hasVideo && hasAudio) return "all";
  if (hasImage && hasVideo) return "images_videos";
  if (hasImage && hasAudio) return "images_audio";
  if (hasVideo && hasAudio) return "videos_audio";
  if (hasImage) return "images";
  if (hasVideo) return "videos";
  if (hasAudio) return "audio";
  return "all";
}

export function MediaFilePicker({
  fieldName,
  fieldSchema,
  description,
  error,
  isRequired = false,
}: PlaygroundMediaFilePickerInputProps) {
  const form = useFormContext();

  const isArrayField = fieldSchema.type === "array";
  const isMulti =
    isArrayField ||
    fieldSchema["x-ui-component"].settings.max > 1 ||
    fieldSchema["x-ui-component"].settings.min > 1;
  const allowedTypes = allowedFileTypesToPickerTypes(
    getAllowedTypesFromXUi(fieldSchema?.["x-ui-component"])
  );
  const title = fieldSchema.title ?? fieldName;
  const maxN = fieldSchema["x-ui-component"].settings.max;

  const [filesArray, setFilesArray] = useState<MediaFilePickerFileEntry[]>([]);

  const rawValue = form.getInputProps(fieldName).value;

  useEffect(() => {
    if (isMulti) {
      const normalized = Array.isArray(rawValue)
        ? rawValue.filter((v): v is string => typeof v === "string" && Boolean(v.trim()))
        : typeof rawValue === "string" && rawValue.trim()
          ? [rawValue]
          : [];

      const shouldUpdate =
        !Array.isArray(rawValue) ||
        normalized.length !== rawValue.length ||
        normalized.some((v, i) => v !== rawValue[i]);

      if (shouldUpdate) {
        form.setFieldValue(fieldName, normalized);
      }
      return;
    }

    if (Array.isArray(rawValue)) {
      form.setFieldValue(fieldName, rawValue[0] || "");
    }
  }, [fieldName, form, isMulti, fieldSchema["x-ui-component"].settings.min, rawValue]);

  const readUrlsMulti = (): string[] => {
    const v = form.values[fieldName];
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  };

  const maxReached = typeof maxN === "number" && filesArray.length >= maxN;
  const showAddZone = isMulti ? !maxReached : filesArray.length === 0;

  const appendItem = (url: string, source: MediaFilePickerSource) => {
    const t = url.trim();
    if (!t) return;
    const arr = readUrlsMulti();
    if (typeof maxN === "number" && arr.length >= maxN) return;
    form.setFieldValue(fieldName, [...arr, t]);
    setFilesArray((prev) => [...prev, { url: t, type: source }]);
  };

  const removeItem = (index: number) => {
    const arr = readUrlsMulti();
    form.setFieldValue(
      fieldName,
      arr.filter((_, i) => i !== index)
    );
    setFilesArray((prev) => prev.filter((_, i) => i !== index));
  };

  const replaceAtFromPicker = (index: number, url: string) => {
    const t = url.trim();
    const arr = readUrlsMulti();
    if (index < 0 || index >= arr.length) return;
    const next = [...arr];
    next[index] = t;
    form.setFieldValue(fieldName, next);
    setFilesArray((prev) => {
      const copy = [...prev];
      copy[index] = { url: t, type: "picker" };
      return copy;
    });
  };

  const setSingleFromPicker = (url: string) => {
    form.setFieldValue(fieldName, url);
    setFilesArray(url.trim() ? [{ url, type: "picker" }] : []);
  };

  const setSingleFromUrlInput = (url: string) => {
    form.setFieldValue(fieldName, url);
    if (!url.trim()) {
      setFilesArray([]);
      return;
    }
    setFilesArray([{ url, type: "addUrl" }]);
  };

  const renderListItem = (item: MediaFilePickerFileEntry, index: number) => {
    if (item.type === "picker") {
      return (
        <PickerMediaRow
          key={`${fieldName}-picker-${index}`}
          fileUrl={item.url}
          allowedTypes={allowedTypes}
          modalTitle={`Select ${title}`}
          onReplace={(path) =>
            isMulti ? replaceAtFromPicker(index, path) : setSingleFromPicker(path)
          }
          onRemove={() => removeItem(index)}
          allowChange
        />
      );
    }
    if (!isMulti) {
      return (
        <Group key={`${fieldName}-url-${index}`} align="flex-end" wrap="nowrap" gap="xs" w="100%">
          <TextInput
            style={{ flex: 1 }}
            size="sm"
            label="URL"
            value={item.url}
            onChange={(e) => setSingleFromUrlInput(e.currentTarget.value)}
          />
          <ActionIcon
            size="lg"
            variant="light"
            color="red"
            aria-label="Remove URL"
            onClick={() => removeItem(index)}
          >
            <RiCloseLine size={18} />
          </ActionIcon>
        </Group>
      );
    }
    return (
      <ManualUrlRow
        key={`${fieldName}-url-${index}`}
        url={item.url}
        onRemove={() => removeItem(index)}
      />
    );
  };

  const addZone = (
    <AddMediaZone
      selectLabel={`Select ${title}`}
      modalTitle={`Select ${title}`}
      allowedTypes={allowedTypes}
      onPickPath={(path) => (isMulti ? appendItem(path, "picker") : setSingleFromPicker(path))}
      onAddUrl={(url) => (isMulti ? appendItem(url, "addUrl") : setSingleFromUrlInput(url))}
    />
  );

  return (
    <Box
      key={form.key(fieldName)}
      pl="md"
      style={{
        borderLeft: "3px solid var(--mantine-color-default-border)",
      }}
    >
      <Input.Wrapper
        id={fieldName}
        label={
          <Text size="sm" fw={500} component="span">
            {title}
          </Text>
        }
        description={description}
        error={error}
        required={isRequired}
      >
        <Stack gap="md">
          <Stack gap="sm">
            {filesArray.length > 0
              ? filesArray.map((item, index) => renderListItem(item, index))
              : null}
          </Stack>

          {showAddZone && (
            <Stack gap="xs">
              <Text size="xs" fw={500} c="dimmed">
                {isMulti ? "Add from library or URL" : "Select from library or add a URL"}
              </Text>
              {addZone}
            </Stack>
          )}

          {isMulti && (
            <Text size="xs" c="dimmed">
              {filesArray.length} (min {fieldSchema["x-ui-component"].settings.min}) /{" "}
              {typeof maxN === "number" ? maxN : "?"} items
            </Text>
          )}
        </Stack>
      </Input.Wrapper>
    </Box>
  );
}

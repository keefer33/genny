import { Box, Card, Center, Loader, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useEffect, useState } from "react";
import { HistoryPreviewWithBadge } from "~/pages/generations/components/HistoryPreviewWithBadge";
import {
  buildMinimalUserFile,
  fetchUserFileByPath,
  isAiFileLinkUrl,
} from "~/lib/files/userFileByPath";
import FileDetailModal, { type FileDetailModalFileItem } from "~/shared/FileDetailModal";

type UserFileRecord = FileDetailModalFileItem & Record<string, unknown>;

function asUserFileRecord(
  raw: Record<string, unknown> | null,
  fallbackUrl: string
): UserFileRecord {
  if (!raw) {
    return buildMinimalUserFile(fallbackUrl) as UserFileRecord;
  }
  return {
    id: typeof raw.id === "string" ? raw.id : "",
    file_name:
      typeof raw.file_name === "string" && raw.file_name.trim()
        ? raw.file_name.trim()
        : fallbackUrl.split("/").pop() || "File",
    file_path: typeof raw.file_path === "string" ? raw.file_path : fallbackUrl,
    file_size: typeof raw.file_size === "number" ? raw.file_size : 0,
    file_type: typeof raw.file_type === "string" ? raw.file_type : "application/octet-stream",
    created_at: typeof raw.created_at === "string" ? raw.created_at : "",
    ...(typeof raw.thumbnail_url === "string" ? { thumbnail_url: raw.thumbnail_url } : {}),
    ...(typeof raw.upload_type === "string" ? { upload_type: raw.upload_type } : {}),
    ...(raw.user_file_tags
      ? { user_file_tags: raw.user_file_tags as FileDetailModalFileItem["user_file_tags"] }
      : {}),
    ...(raw.generated_info ? { generated_info: raw.generated_info } : {}),
    ...(typeof raw.character_id === "string" ? { character_id: raw.character_id } : {}),
  };
}

export type MarkdownAiFileLinkProps = {
  url: string;
  label?: string;
};

export function MarkdownAiFileLink({ url, label }: MarkdownAiFileLinkProps) {
  const [file, setFile] = useState<UserFileRecord>(() => buildMinimalUserFile(url) as UserFileRecord);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [previewOpen, { open: openPreview, close: closePreview }] = useDisclosure(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!isAiFileLinkUrl(url)) {
        setFile(null);
        setMetadataLoading(false);
        return;
      }

      setFile(buildMinimalUserFile(url) as UserFileRecord);
      setMetadataLoading(true);
      try {
        const data = await fetchUserFileByPath(url);
        if (cancelled) return;
        if (data) {
          setFile(asUserFileRecord(data, url));
        }
      } catch {
        if (cancelled) return;
      } finally {
        if (!cancelled) setMetadataLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!isAiFileLinkUrl(url)) return null;

  const displayName = file?.file_name?.trim() || label?.trim() || "File";
  const previewUrl = file?.thumbnail_url?.trim() || file?.file_path?.trim() || url;
  const fileType = file?.file_type?.trim() || "application/octet-stream";
  const canOpenDetail = Boolean(file?.id?.trim());

  return (
    <>
      <Card
        withBorder
        radius="md"
        p="xs"
        my="xs"
        maw={360}
        style={{ cursor: canOpenDetail ? "pointer" : "default" }}
        onClick={() => {
          if (canOpenDetail) openPreview();
        }}
      >
        <Stack gap="xs">
          <Box h={140} pos="relative" style={{ overflow: "hidden", borderRadius: "var(--mantine-radius-sm)" }}>
            <HistoryPreviewWithBadge
              url={previewUrl}
              file_type={fileType}
              upload_type={file?.upload_type}
            />
            {metadataLoading ? (
              <Center
                pos="absolute"
                top={8}
                right={8}
                w={28}
                h={28}
                style={{
                  borderRadius: "var(--mantine-radius-sm)",
                  background: "rgba(0, 0, 0, 0.45)",
                }}
              >
                <Loader size="xs" color="white" />
              </Center>
            ) : null}
          </Box>
          <Text size="sm" fw={600} lineClamp={2}>
            {displayName}
          </Text>
          {label && label.trim() !== displayName ? (
            <Text size="xs" c="dimmed" lineClamp={2}>
              {label}
            </Text>
          ) : null}
        </Stack>
      </Card>

      {canOpenDetail && previewOpen ? (
        <FileDetailModal opened={previewOpen} onClose={closePreview} file={file} />
      ) : null}
    </>
  );
}

export { isAiFileLinkUrl } from "~/lib/files/userFileByPath";

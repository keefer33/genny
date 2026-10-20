import { Box, Card, Center, Loader } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useEffect, useState } from "react";
import { HistoryPreviewWithBadge } from "~/pages/generations/components/HistoryPreviewWithBadge";
import { MediaTypeBadge } from "~/shared/MediaTypeBadge";
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
    ...(raw.gen_model_id != null
      ? { gen_model_id: raw.gen_model_id as FileDetailModalFileItem["gen_model_id"] }
      : {}),
  };
}

export type MarkdownAiFileLinkProps = {
  url: string;
  label?: string;
};

export function MarkdownAiFileLink({ url, label }: MarkdownAiFileLinkProps) {
  const [file, setFile] = useState<UserFileRecord>(
    () => buildMinimalUserFile(url) as UserFileRecord
  );
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

  const previewUrl = file?.thumbnail_url?.trim() || file?.file_path?.trim() || url;
  const fileType = file?.file_type?.trim() || "application/octet-stream";
  const canOpenDetail = Boolean(file?.id?.trim());

  return (
    <>
      <Card
        radius="md"
        p={0}
        w={300}
        style={{ cursor: canOpenDetail ? "pointer" : "default" }}
        onClick={() => {
          if (canOpenDetail) openPreview();
        }}
      >
        <Box pos="relative">
          {fileType.startsWith("audio/") ? (
            <Box h={96}>
              <HistoryPreviewWithBadge
                url={previewUrl}
                file_type={fileType}
                upload_type={file?.upload_type}
              />
            </Box>
          ) : (
            <>
              <img
                src={previewUrl}
                alt={label || "Generated file"}
                style={{
                  display: "block",
                  width: "100%",
                  height: "auto",
                  //maxHeight: 280,
                  //objectFit: "contain",
                }}
              />
              <MediaTypeBadge
                size="sm"
                variant="filled"
                file_type={fileType}
                pos="absolute"
                top={6}
                left={6}
                style={{ zIndex: 2, textTransform: "none", pointerEvents: "none" }}
              />
            </>
          )}
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
      </Card>

      {canOpenDetail && previewOpen ? (
        <FileDetailModal
          opened={previewOpen}
          onClose={closePreview}
          file={file}
          onFileUpdated={(fileId, patch) => {
            if (file.id !== fileId || !patch?.file_name?.trim()) return;
            setFile((prev) => ({ ...prev, file_name: patch.file_name!.trim() }));
          }}
        />
      ) : null}
    </>
  );
}

export { isAiFileLinkUrl } from "~/lib/files/userFileByPath";

import { Modal, ActionIcon, Button, Tabs, Scroller } from "@mantine/core";
import { RiEyeLine } from "@remixicon/react";
import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from "react";
import { FileDetails } from "./FileDetails";
import { useDisclosure } from "@mantine/hooks";

interface UserTag {
  id: string;
  created_at: string;
  user_id: string;
  tag_name: string;
}

interface UserFileTag {
  file_id: string;
  tag_id: string;
  created_at: string;
  user_tags: UserTag;
}

/** Catalog model embed from `user_files.gen_model_id` (when present). */
export type FileDetailGenModelEmbed = {
  id?: string;
  model_name?: string | null;
  brand_name?:
    | string
    | null
    | { name?: string | null; logo?: string | null; slug?: string | null };
  model_product?: string | null;
  model_variant?: string | null;
};

export interface FileDetailModalFileItem {
  id: string;
  character_id?: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  created_at: string;
  user_file_tags?: UserFileTag[];
  thumbnail_url?: string;
  generated_info?: unknown;
  upload_type?: string;
  /** Embedded gen model used to create the file, when applicable. */
  gen_model_id?: FileDetailGenModelEmbed | string | null;
}

export type FileDetailModalFile = Array<
  { id: string } & Partial<Omit<FileDetailModalFileItem, "id">>
>;

type FileDetailModalFileInput =
  | FileDetailModalFile
  | ({ id: string } & Partial<Omit<FileDetailModalFileItem, "id">>)
  | null
  | undefined;

type FileDetailModalProps = {
  file: FileDetailModalFileInput;
  buttonType?: "button" | "viewicon" | "wrapper";
  children?: ReactNode;
  opened?: boolean;
  onClose?: () => void;
  modelName?: string;
  onDownload?: () => void;
  onEdit?: () => void;
  onTagsUpdated?: (fileId: string, updatedTags: any) => void;
  /** Called after a non-delete file mutation (e.g. rename, switch base look). */
  onFileUpdated?: (fileId: string, patch?: { file_name?: string }) => void;
  /** Called after a file is deleted from {@link FileDetails} (refresh lists, close modal). */
  onFileDeleted?: (fileId: string) => void;
};

function normalizeModalFiles(file: FileDetailModalFileInput): FileDetailModalFileItem[] {
  const rawFiles = Array.isArray(file) ? file : file ? [file] : [];
  return rawFiles.filter(Boolean).map((f, index) => ({
    id: f.id,
    file_name: f.file_name?.trim() || `File ${index + 1}`,
    file_path: f.file_path ?? "",
    file_size: f.file_size ?? 0,
    file_type: f.file_type ?? "",
    created_at: f.created_at ?? "",
    user_file_tags: f.user_file_tags,
    thumbnail_url: f.thumbnail_url,
    generated_info: f.generated_info,
    upload_type: f.upload_type,
    character_id: f.character_id,
    gen_model_id: f.gen_model_id,
  }));
}

/** Eye control for file tiles — opens {@link FileDetailModal} (place inside a `position: relative` preview). */
export function FileCardViewDetailsButton({
  onClick,
  size = "md",
}: {
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}) {
  const iconPx =
    size === "xs" ? 14 : size === "sm" ? 16 : size === "lg" ? 20 : size === "xl" ? 22 : 18;
  return (
    <ActionIcon
      pos="absolute"
      bottom={6}
      right={6}
      variant="default"
      radius="md"
      size={size}
      aria-label="View file details"
      title="View file details"
      onClick={onClick}
    >
      <RiEyeLine size={iconPx} />
    </ActionIcon>
  );
}

export default function FileDetailModal({
  file,
  onTagsUpdated,
  buttonType = "button",
  children,
  opened,
  onClose,
  onFileDeleted,
  onFileUpdated,
}: FileDetailModalProps) {
  const [internalOpened, { open: openFileDetailModal, close: closeFileDetailModal }] =
    useDisclosure(false);
  const fileDetailOpened = opened ?? internalOpened;
  const closeDetails = onClose ?? closeFileDetailModal;
  const openDetails = () => openFileDetailModal();
  const shouldRenderTrigger = opened == null;

  const propFiles = useMemo(() => normalizeModalFiles(file), [file]);
  const propFileIds = propFiles.map((f) => f.id).join(",");
  const [files, setFiles] = useState<FileDetailModalFileItem[]>(propFiles);

  // Resync when the modal opens or the set of file ids changes — not on every
  // parent re-render with a stale file_name after rename.
  useEffect(() => {
    if (!fileDetailOpened) return;
    setFiles(normalizeModalFiles(file));
  }, [fileDetailOpened, propFileIds]);

  const firstFileId = files[0]?.id ?? "file-0";

  const handleUpdated = (fileId: string, patch?: { file_name?: string }) => {
    if (patch?.file_name?.trim()) {
      const nextName = patch.file_name.trim();
      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, file_name: nextName } : f))
      );
    }
    onFileUpdated?.(fileId, patch);
  };

  return (
    <>
      {shouldRenderTrigger ? (
        buttonType === "button" ? (
          <Button
            variant="subtle"
            size="compact-xs"
            leftSection={<RiEyeLine size={14} />}
            onClick={openDetails}
          >
            View details
          </Button>
        ) : buttonType === "viewicon" ? (
          <FileCardViewDetailsButton onClick={openDetails} />
        ) : (
          <span
            role="button"
            tabIndex={0}
            onClick={openDetails}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openDetails();
              }
            }}
            style={{ cursor: "pointer" }}
          >
            {children}
          </span>
        )
      ) : null}
      <Modal
        opened={fileDetailOpened}
        onClose={closeDetails}
        fullScreen
        styles={{
          body: { padding: 0 },
          header: { padding: "2px", minHeight: "10px" },
          root: { maxHeight: "10px" },
        }}
      >
        {files.length <= 1 ? (
          files[0] ? (
            <FileDetails
              file={files[0]}
              onTagsUpdated={onTagsUpdated}
              onUpdated={handleUpdated}
              onDeleted={onFileDeleted}
            />
          ) : null
        ) : (
          <Tabs defaultValue={firstFileId} keepMounted={false}>
            <Tabs.List px="md">
              <Scroller>
                {files.map((f, index) => (
                  <Tabs.Tab key={f.id} value={f.id}>
                    {f.file_name?.trim() || `File ${index + 1}`}
                  </Tabs.Tab>
                ))}
              </Scroller>
            </Tabs.List>
            {files.map((f) => (
              <Tabs.Panel key={f.id} value={f.id}>
                <FileDetails
                  file={f}
                  onTagsUpdated={onTagsUpdated}
                  onUpdated={handleUpdated}
                  onDeleted={onFileDeleted}
                />
              </Tabs.Panel>
            ))}
          </Tabs>
        )}
      </Modal>
    </>
  );
}

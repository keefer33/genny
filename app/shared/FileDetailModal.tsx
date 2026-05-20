import { Modal, ActionIcon, Button, Tabs, Scroller } from "@mantine/core";
import { RiEyeLine } from "@remixicon/react";
import type { MouseEvent, ReactNode } from "react";
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

export interface FileDetailModalFileItem {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  created_at: string;
  user_file_tags?: UserFileTag[];
  thumbnail_url?: string;
  generated_info?: unknown;
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
  /** Called after a file is deleted from {@link FileDetails} (refresh lists, close modal). */
  onFileDeleted?: (fileId: string) => void;
};

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
}: FileDetailModalProps) {
  const [internalOpened, { open: openFileDetailModal, close: closeFileDetailModal }] =
    useDisclosure(false);
  const rawFiles = Array.isArray(file) ? file : file ? [file] : [];
  const files: FileDetailModalFileItem[] = rawFiles.filter(Boolean).map((f, index) => ({
    id: f.id,
    file_name: f.file_name?.trim() || `File ${index + 1}`,
    file_path: f.file_path ?? "",
    file_size: f.file_size ?? 0,
    file_type: f.file_type ?? "",
    created_at: f.created_at ?? "",
    user_file_tags: f.user_file_tags,
    thumbnail_url: f.thumbnail_url,
    generated_info: f.generated_info,
  }));
  const firstFileId = files[0]?.id ?? "file-0";
  const fileDetailOpened = opened ?? internalOpened;
  const closeDetails = onClose ?? closeFileDetailModal;
  const openDetails = () => openFileDetailModal();
  const shouldRenderTrigger = opened == null;

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
        //title={file.file_name}
        fullScreen
        styles={{
          body: { padding: 0 },
          header: { padding: "2px", minHeight: "10px" },
          root: { maxHeight: "10px" },
        }}
      >
        {files.length <= 1 ? (
          files[0] ? (
            <FileDetails file={files[0]} onTagsUpdated={onTagsUpdated} onDeleted={onFileDeleted} />
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
                <FileDetails file={f} onTagsUpdated={onTagsUpdated} onDeleted={onFileDeleted} />
              </Tabs.Panel>
            ))}
          </Tabs>
        )}
      </Modal>
    </>
  );
}

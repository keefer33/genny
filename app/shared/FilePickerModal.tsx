import { Modal } from "@mantine/core";
import { useEffect } from "react";
import useFilesFoldersStore from "~/lib/stores/filesFoldersStore";
import useAppStore from "~/lib/stores/appStore";
import { FilePickerContent } from "../pages/files/components/FilePickerContent";
import type { FileData } from "~/lib/stores/filesFoldersStore";

interface FilePickerModalProps {
  opened: boolean;
  onClose: () => void;
  onSelect: (fileUrl: string, file?: FileData) => void;
  title?: string;
  allowedTypes?: "images" | "videos" | "all"; // Filter by file type, default is "all"
}

export function FilePickerModal({
  opened,
  onClose,
  onSelect,
  title = "Select File",
  allowedTypes = "all",
}: FilePickerModalProps) {
  const { resetFilters } = useFilesFoldersStore();
  const { isMobile } = useAppStore();

  // Reset filters when modal opens to ensure clean state
  useEffect(() => {
    if (opened) {
      resetFilters();
      // Set file type filter if locked to specific type
      if (allowedTypes === "images" || allowedTypes === "videos") {
        useFilesFoldersStore.getState().setFileTypeFilter(allowedTypes);
      }
    }
  }, [opened, allowedTypes, resetFilters]);

  const handleFileSelect = (file: FileData) => {
    onSelect(file.file_path, file);
    onClose();
  };

  const handleUploadComplete = async () => {
    // Refresh will be handled by FilePickerContent
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      size="xl"
      fullScreen={isMobile}
      centered={!isMobile}
      overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
    >
      <FilePickerContent
        onFileSelect={handleFileSelect}
        allowedTypes={allowedTypes}
        showUpload={true}
        onUploadComplete={handleUploadComplete}
      />
    </Modal>
  );
}

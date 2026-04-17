import { Modal } from "@mantine/core";
import useAppStore from "~/lib/stores/appStore";
import { FilePickerContent } from "../pages/files/components/FilePickerContent";
import type { FileData } from "~/lib/stores/filesFoldersStore";

interface FilePickerModalProps {
  opened: boolean;
  onClose: () => void;
  onSelect: (fileUrl: string, file?: FileData) => void;
  title?: string;
  allowedTypes?: "images" | "videos" | "audio" | "all"; // Filter by file type, default is "all"
}

export function FilePickerModal({
  opened,
  onClose,
  onSelect,
  title = "Select File",
  allowedTypes = "all",
}: FilePickerModalProps) {
  const { isMobile } = useAppStore();

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

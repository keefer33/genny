import { Alert, Box, Text, Button } from "@mantine/core";
import { RiUploadLine } from "@remixicon/react";
import { useRef, useState } from "react";
import useFilesFoldersStore, { type FileTypeFilter } from "~/lib/stores/filesFoldersStore";
import useAppStore from "~/lib/stores/appStore";

interface FileUploadProps {
  onUploadComplete?: () => void;
  allowedTypes?: FileTypeFilter;
}

function acceptForAllowedTypes(allowedTypes: FileTypeFilter): string {
  const accepts = [
    allowedTypes.includes("images") ? "image/*" : null,
    allowedTypes.includes("videos") ? "video/*" : null,
    allowedTypes.includes("audio") ? "audio/*" : null,
  ].filter((accept): accept is string => Boolean(accept));
  return accepts.length > 0 ? accepts.join(",") : "image/*,video/*,audio/*";
}

export default function FileUpload({ onUploadComplete, allowedTypes = "all" }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, isMobile } = useAppStore();
  const { uploadFile, uploading, refreshData } = useFilesFoldersStore();

  const handleFileSelect = async (files: FileList | null) => {
    const userId = user?.user?.id;
    if (!files || files.length === 0 || !userId) return;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        await uploadFile(file, userId);
      }

      // Refresh data after upload
      await refreshData(userId);
      onUploadComplete?.();
    } catch (error) {
      console.error("Error uploading files:", error);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: "none" }}
        onChange={(e) => handleFileSelect(e.target.files)}
        accept={acceptForAllowedTypes(allowedTypes)}
      />

      {isMobile ? (
        <Button
          leftSection={<RiUploadLine size={18} />}
          variant="light"
          fullWidth
          onClick={handleClick}
          loading={uploading}
        >
          Upload
        </Button>
      ) : (
        <>
          <Alert
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onMouseOver={() => setDragOver(true)}
            onMouseLeave={() => setDragOver(false)}
            variant={dragOver ? "filled" : "transparent"}
            title="Click to upload or drag files here"
            icon={<RiUploadLine size={20} />}
            p={7}
          />

          {uploading && (
            <Text size="sm" c="blue" ta="center" mt="sm">
              Uploading files...
            </Text>
          )}
        </>
      )}
    </Box>
  );
}

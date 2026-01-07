import { Anchor } from "@mantine/core";
import slugify from "slugify";
import { v4 as uuidv4 } from "uuid";
import { showNotification } from "./notificationUtils";

export const generateNewApiKey = () => {
  return uuidv4();
};

export const getInitials = (name: string) => {
  return name?.substring(0, 2).toUpperCase();
};

export const getModelName = (modelId: string | null, models: any[]) => {
  if (!modelId) return "No model selected";
  const model = models?.find((m) => m.id === modelId);
  return model ? `${model.brand} - ${model.model}` : "Unknown model";
};

export const getModelBrand = (modelId: string | null, models: any[]) => {
  if (!modelId) return null;
  const model = models?.find((m) => m.id === modelId);
  return model?.brand || null;
};

export const maskApiKey = (key: string) => {
  if (!key || key.length <= 8) return "*".repeat(key.length || 8);
  return key.substring(0, 4) + "*".repeat(key.length - 8) + key.substring(key.length - 4);
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const getFileExtension = (filename: string) => {
  return filename.split(".").pop()?.toLowerCase() || "";
};

export const isImageFile = (filename: string) => {
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
  return imageExtensions.includes(getFileExtension(filename));
};

export const isTextFile = (filename: string) => {
  const textExtensions = [
    "txt",
    "md",
    "json",
    "csv",
    "xml",
    "html",
    "css",
    "js",
    "ts",
    "jsx",
    "tsx",
  ];
  return textExtensions.includes(getFileExtension(filename));
};

export const getFileExtensionFromUrl = (url: string): string => {
  try {
    const pathname = new URL(url).pathname;
    return pathname.split(".").pop()?.toLowerCase() || "";
  } catch {
    return url.split(".").pop()?.toLowerCase() || "";
  }
};

export const isVideoFile = (filename: string) => {
  const videoExtensions = ["mp4", "webm", "ogg", "avi", "mov", "wmv"];
  return videoExtensions.includes(getFileExtension(filename));
};

export const isAudioFile = (filename: string) => {
  const audioExtensions = ["mp3", "wav", "ogg", "aac", "flac", "m4a"];
  return audioExtensions.includes(getFileExtension(filename));
};

export const isDocumentFile = (filename: string) => {
  const documentExtensions = ["pdf", "doc", "docx", "txt", "rtf", "odt"];
  return documentExtensions.includes(getFileExtension(filename));
};

export const getFileType = (
  filename: string
): "video" | "image" | "audio" | "document" | "unknown" => {
  if (isVideoFile(filename)) return "video";
  if (isImageFile(filename)) return "image";
  if (isAudioFile(filename)) return "audio";
  if (isDocumentFile(filename)) return "document";
  return "unknown";
};

export const slug = (text: string, replacement = "-"): string => {
  if (!text) return "";
  return slugify(text, {
    replacement: replacement,
    lower: true,
    strict: true,
    locale: "en",
    trim: true,
  });
};

// Global copy to clipboard function
export const copyToClipboard = async (textToCopy: string | string[]) => {
  try {
    const textString = Array.isArray(textToCopy) ? textToCopy.join("\n") : textToCopy;
    await navigator.clipboard.writeText(textString);
    return true;
  } catch {
    // Fallback for older browsers
    const textString = Array.isArray(textToCopy) ? textToCopy.join("\n") : textToCopy;
    const textArea = document.createElement("textarea");
    textArea.value = textString;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    return true;
  }
};

export const showError = (error: any) => {
  showNotification({ title: "Error", message: error.message, type: "error" });
};

export const handleErrors = (errors: any[]) => {
  errors.forEach((error) => {
    showNotification({ title: "Error", message: error.message || error, type: "error" });
  });
};

export const endpoint =
  import.meta.env.VITE_NODE_ENV === "development"
    ? import.meta.env.VITE_LOCAL_API_URL
    : import.meta.env.VITE_API_URL;

export const renderMarkdownLinks = (text: string) => {
  const parts = text.split(/(\[.*?\]\(.*?\))/g).filter(Boolean);
  return parts.map((part, idx) => {
    const match = part.match(/\[(.*?)\]\((.*?)\)/);
    if (match) {
      return (
        <Anchor key={idx} href={match[2]} target="_blank">
          {match[1]}
        </Anchor>
      );
    }
    return <span key={idx}>{part}</span>;
  });
};

/**
 * Format a number or string as currency with up to 4 decimal places, removing trailing zeros
 * @param amount - The amount to format (string or number)
 * @returns Formatted currency string (e.g., "$1.2345", "$0.003", "$0.03")
 */
export const formatCurrency = (amount: string | number) => {
  const num = Number(amount);
  // Use toFixed(4) to get up to 4 decimal places, then remove trailing zeros
  const formatted = num.toFixed(4).replace(/\.?0+$/, "");
  return `$${formatted}`;
};

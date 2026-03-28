export const getInitials = (name: string) => {
  return name?.substring(0, 2).toUpperCase();
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

export const endpoint =
  import.meta.env.VITE_NODE_ENV === "development"
    ? import.meta.env.VITE_LOCAL_API_URL
    : import.meta.env.VITE_API_URL;

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

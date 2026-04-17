import { ActionIcon } from "@mantine/core";
import { useState } from "react";
import { RiCheckLine, RiCloseLine, RiFileCopyLine } from "@remixicon/react";
import { useFormContext } from "~/lib/ContextForm";

export function PromptActionButtons({
  fieldName,
  fieldValue,
}: {
  fieldName: string;
  fieldValue: string;
}) {
  const form = useFormContext();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fieldValue || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const handleClear = () => {
    form.setFieldValue(fieldName, "");
  };

  return (
    <>
      <ActionIcon
        variant="light"
        size="sm"
        color="blue.5"
        onClick={handleCopy}
        disabled={!fieldValue}
        title={copied ? "Copied!" : "Copy to clipboard"}
      >
        {copied ? <RiCheckLine size={14} /> : <RiFileCopyLine size={14} />}
      </ActionIcon>
      <ActionIcon
        variant="light"
        size="sm"
        color="red.5"
        onClick={handleClear}
        disabled={!fieldValue}
        title="Clear prompt"
      >
        <RiCloseLine size={14} />
      </ActionIcon>
    </>
  );
}

import { Button, Loader } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { RiCloseLine, RiAiGenerate2 } from "@remixicon/react";
import { useState, useRef } from "react";
import { useFormContext } from "~/lib/ContextForm";
import useAppStore from "~/lib/stores/appStore";

interface EnhancePromptButtonProps {
  generationType: "image" | "video";
  fieldName: string;
  disabled?: boolean;
}

export function EnhancePromptButton({
  generationType,
  fieldName,
  disabled = false,
}: EnhancePromptButtonProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const form = useFormContext();
  const abortControllerRef = useRef<AbortController | null>(null);
  const { getAuthApiKey } = useAppStore();
  const enhancePrompt = async () => {
    // Get the current prompt value from the form
    const currentPrompt = form.getInputProps(fieldName).value || "";

    if (!currentPrompt.trim()) {
      notifications.show({
        title: "Enhancement Failed",
        message: "Please enter a prompt to enhance",
        color: "red",
      });
      return;
    }

    setIsStreaming(true);
    // Clear the prompt field immediately
    form.setFieldValue(fieldName, "");

    try {
      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      const response = await fetch(
        `${import.meta.env.VITE_NODE_ENV === "development" ? import.meta.env.VITE_LOCAL_API_URL : import.meta.env.VITE_API_URL}/agents/enhance/prompt`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthApiKey() || ""}`,
          },
          body: JSON.stringify({
            prompt: currentPrompt,
            generationType,
          }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullPrompt = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Decode chunk and add directly to prompt
          const chunk = decoder.decode(value, { stream: true });
          fullPrompt += chunk;
          // Update the form field with the streaming value
          form.setFieldValue(fieldName, fullPrompt);
        }
      } finally {
        reader.releaseLock();
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        // Request was cancelled, don't show error
        return;
      }
      console.error("Error enhancing prompt:", err);
      notifications.show({
        title: "Enhancement Failed",
        message: err.message || "Failed to enhance prompt. Please try again.",
        color: "red",
      });
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const cancelEnhancement = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
  };

  return (
    <>
      {isStreaming ? (
        <Button
          size="xs"
          variant="light"
          color="red"
          leftSection={<RiCloseLine size={14} />}
          onClick={cancelEnhancement}
        >
          Cancel
        </Button>
      ) : (
        <Button
          size="xs"
          variant="light"
          onClick={enhancePrompt}
          disabled={disabled || isStreaming}
          leftSection={isStreaming ? <Loader size="xs" /> : <RiAiGenerate2 size={14} />}
        >
          Enhance
        </Button>
      )}
    </>
  );
}

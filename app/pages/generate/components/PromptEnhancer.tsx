import {
  Button,
  Modal,
  Textarea,
  Stack,
  Group,
  Text,
  ActionIcon,
  Box,
  Loader,
  Alert,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useState, useRef, useEffect } from "react";
import { useFormContext } from "~/lib/ContextForm";
import { RiMagicLine, RiFileCopyLine, RiCheckLine, RiCloseLine } from "@remixicon/react";
import useAppStore from "~/lib/stores/appStore";

interface PromptEnhancerProps {
  generationType?: "image" | "video";
  promptText?: string;
  fieldName?: string;
  buttonText?: string;
  buttonVariant?: "filled" | "light" | "outline" | "subtle" | "default";
  buttonSize?: "xs" | "sm" | "md" | "lg" | "xl";
  disabled?: boolean;
}

export function PromptEnhancer({
  generationType = "image",
  promptText = "",
  fieldName,
  buttonText = "Enhance Prompt",
  buttonVariant = "light",
  buttonSize = "sm",
  disabled = false,
}: PromptEnhancerProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [originalPrompt, setOriginalPrompt] = useState(promptText);
  const [enhancedPrompt, setEnhancedPrompt] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const form = useFormContext();
  const abortControllerRef = useRef<AbortController | null>(null);
  const { getAuthApiKey } = useAppStore();
  // Update original prompt when promptText prop changes
  useEffect(() => {
    setOriginalPrompt(promptText);
  }, [promptText]);

  // Reset state when modal opens
  useEffect(() => {
    if (opened) {
      setOriginalPrompt(promptText);
      setEnhancedPrompt("");
      setError(null);
      setCopied(false);
    }
  }, [opened, promptText]);

  const enhanceRandomPrompt = async () => {
    setIsStreaming(true);
    setError(null);
    setEnhancedPrompt("");

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
            prompt: "random",
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
          setEnhancedPrompt(fullPrompt);
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
      setError(err.message || "Failed to enhance prompt");
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const enhancePrompt = async () => {
    if (!originalPrompt.trim()) {
      setError("Please enter a prompt to enhance");
      return;
    }

    setIsStreaming(true);
    setError(null);
    setEnhancedPrompt("");

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
            prompt: originalPrompt,
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
          setEnhancedPrompt(fullPrompt);
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
      setError(err.message || "Failed to enhance prompt");
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(enhancedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const updateFormField = () => {
    if (fieldName && enhancedPrompt) {
      form.setFieldValue(fieldName, enhancedPrompt);
      close();
    }
  };

  const cancelEnhancement = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
  };

  const handleClose = () => {
    if (isStreaming) {
      cancelEnhancement();
    }
    close();
  };

  return (
    <>
      <Button
        leftSection={<RiMagicLine size={16} />}
        variant={buttonVariant}
        size={buttonSize}
        onClick={open}
        disabled={disabled}
      >
        {buttonText}
      </Button>

      <Modal
        opened={opened}
        onClose={handleClose}
        title="Enhance Prompt"
        size="lg"
        closeOnClickOutside={!isStreaming}
        closeOnEscape={!isStreaming}
      >
        <Stack gap="md">
          {/* Original prompt display */}
          <Box>
            <Group justify="space-between" align="center" mb="xs">
              <Text size="sm" fw={500}>
                Original Prompt:
              </Text>
              <Button
                size="xs"
                variant="filled"
                onClick={enhanceRandomPrompt}
                disabled={isStreaming}
                leftSection={<RiMagicLine size={12} />}
              >
                Random
              </Button>
            </Group>
            <Textarea
              value={originalPrompt}
              onChange={(event) => setOriginalPrompt(event.currentTarget.value)}
              placeholder="Enter your prompt here or click Random to enhance directly..."
              minRows={2}
              maxRows={4}
              autosize
              resize="vertical"
            />
          </Box>

          {/* Error display */}
          {error && (
            <Alert color="red" title="Error">
              {error}
            </Alert>
          )}

          {/* Enhanced prompt display */}
          <Box>
            <Group justify="space-between" align="center" mb="xs">
              <Text size="sm" fw={500}>
                Enhanced Prompt:
              </Text>
              {enhancedPrompt && (
                <Group gap="xs">
                  <ActionIcon
                    variant="light"
                    size="sm"
                    onClick={copyToClipboard}
                    title={copied ? "Copied!" : "Copy to clipboard"}
                  >
                    {copied ? <RiCheckLine size={14} /> : <RiFileCopyLine size={14} />}
                  </ActionIcon>
                </Group>
              )}
            </Group>
            <Textarea
              value={enhancedPrompt}
              placeholder={
                isStreaming
                  ? "Enhancing prompt..."
                  : "Click 'Enhance' to generate an improved prompt"
              }
              readOnly
              minRows={4}
              maxRows={8}
              autosize
              rightSection={isStreaming ? <Loader size="sm" /> : null}
            />
          </Box>

          {/* Action buttons */}
          <Group justify="space-between">
            <Group>
              {!isStreaming && !enhancedPrompt && (
                <>
                  <Button
                    leftSection={<RiMagicLine size={16} />}
                    onClick={enhancePrompt}
                    disabled={!originalPrompt.trim()}
                  >
                    Enhance
                  </Button>
                  <Button
                    leftSection={<RiMagicLine size={16} />}
                    variant="light"
                    onClick={enhanceRandomPrompt}
                  >
                    Random
                  </Button>
                </>
              )}
              {isStreaming && (
                <Button
                  leftSection={<RiCloseLine size={16} />}
                  variant="outline"
                  color="red"
                  onClick={cancelEnhancement}
                >
                  Cancel
                </Button>
              )}
            </Group>

            <Group>
              <Button variant="outline" onClick={handleClose}>
                {fieldName && enhancedPrompt ? "Cancel" : "Close"}
              </Button>
              {fieldName && enhancedPrompt && (
                <Button onClick={updateFormField}>Update Field</Button>
              )}
            </Group>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}

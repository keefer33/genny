import { Button, Loader, Modal, Select, Textarea, Group, Stack } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { RiCloseLine, RiAiGenerateText } from "@remixicon/react";
import { useState, useRef } from "react";
import { useFormContext } from "~/lib/ContextForm";
import useAppStore from "~/lib/stores/appStore";
import { endpoint } from "~/lib/utils";

const AGENT_MODELS = [
  { value: "anthropic/claude-opus-4.7", label: "Claude Opus 4.7" },
  { value: "google/gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite" },
  { value: "xai/grok-4.3", label: "Grok 4.3" },
  { value: "openai/gpt-5.5", label: "GPT-5.5" },
] as const;

function formatFormValuesForAgent(formValues: Record<string, unknown>): string {
  if (!formValues || typeof formValues !== "object") return "";
  const skipKeys = new Set(["prompt", "message", "description"]);
  const entries: string[] = [];

  const add = (key: string, value: unknown) => {
    if (value === undefined || value === null || value === "") return;
    if (skipKeys.has(key)) return;
    const str = typeof value === "object" ? JSON.stringify(value) : String(value);
    if (str.length > 300) return;
    entries.push(`${key}: ${str}`);
  };

  const walk = (obj: Record<string, unknown>, prefix = "") => {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        typeof (value as any)?.length !== "number"
      ) {
        walk(value as Record<string, unknown>, fullKey);
      } else {
        add(fullKey, value);
      }
    }
  };

  walk(formValues);
  if (entries.length === 0) return "";
  return entries.join("\n");
}

interface AgentPromptButtonProps {
  generationType: "image" | "video" | "audio";
  fieldName: string;
  promptMaxLength?: number;
  disabled?: boolean;
}

export function AgentPromptButton({
  generationType,
  fieldName,
  promptMaxLength,
  disabled = false,
}: AgentPromptButtonProps) {
  const [opened, setOpened] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState<string | null>(AGENT_MODELS[0].value);
  const [isStreaming, setIsStreaming] = useState(false);
  const form = useFormContext();
  const abortControllerRef = useRef<AbortController | null>(null);
  const { getAuthApiKey } = useAppStore();

  const openModal = () => {
    const formValues = typeof form.getValues === "function" ? form.getValues() : { ...form.values };
    const formValuesText = formatFormValuesForAgent(formValues);
    const paramsBlock = formValuesText ? `\n\nParameters:\n${formValuesText}` : "";
    const currentPrompt = String(form.getInputProps(fieldName).value ?? "").trim();
    const initialMessage = currentPrompt
      ? `Enhance the following text for a ${generationType} using the following parameters:${paramsBlock}\n\n--- Text to enhance ---\n${currentPrompt}`
      : `Create a random ${generationType} using the following parameters:${paramsBlock}`;
    setMessage(initialMessage);
    setSelectedModel(AGENT_MODELS[0].value);
    setOpened(true);
  };

  const sendToAgent = async () => {
    if (!message.trim() || !selectedModel) return;

    setIsStreaming(true);
    setOpened(false);
    form.setFieldValue(fieldName, "");

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch(`${endpoint}/agents/enhance/prompt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthApiKey() || ""}`,
        },
        body: JSON.stringify({
          message,
          model: selectedModel,
          generationType,
          formValues: typeof form.getValues === "function" ? form.getValues() : { ...form.values },
          ...(typeof promptMaxLength === "number" && promptMaxLength > 0
            ? { promptMaxLength }
            : {}),
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = errorText;
        try {
          const json = JSON.parse(errorText);
          if (typeof json?.error === "string") errorMessage = json.error;
        } catch {
          // use raw errorText
        }
        throw new Error(errorMessage || `Request failed (${response.status})`);
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullPrompt = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullPrompt += chunk;
          form.setFieldValue(fieldName, fullPrompt);
        }
      } finally {
        reader.releaseLock();
      }
    } catch (err: any) {
      if (err.name === "AbortError") return;
      console.error("Agent prompt error:", err);
      notifications.show({
        title: "Prompt enhancement failed",
        message: err.message || "Failed to get response. Please try again.",
        color: "red",
      });
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const cancelRequest = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setIsStreaming(false);
  };

  return (
    <>
      <Group gap="xs">
        <Button
          size="xs"
          variant="transparent"
          onClick={openModal}
          disabled={disabled || isStreaming}
        >
          {isStreaming ? <Loader size={14} /> : <RiAiGenerateText size={18} />}
        </Button>
        {isStreaming && (
          <Button
            size="xs"
            variant="light"
            color="red"
            leftSection={<RiCloseLine size={14} />}
            onClick={cancelRequest}
          >
            Cancel
          </Button>
        )}
      </Group>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Agent: Create or enhance prompt"
        size="lg"
      >
        <Stack gap="md">
          <Select
            label="Model"
            data={AGENT_MODELS.map((m) => ({ value: m.value, label: m.label }))}
            value={selectedModel}
            onChange={(v) => setSelectedModel(v)}
            allowDeselect={false}
          />
          <Textarea
            label="Message to agent"
            description="Edit the message below; the agent will use it plus the current form parameters."
            value={message}
            onChange={(e) => setMessage(e.currentTarget.value)}
            minRows={8}
            autosize
            resize="vertical"
          />
          <Group justify="flex-end">
            <Button
              size="sm"
              variant="filled"
              onClick={sendToAgent}
              disabled={!message.trim() || !selectedModel}
            >
              Send
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}

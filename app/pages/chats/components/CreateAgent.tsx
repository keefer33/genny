import {
  Badge,
  Button,
  Card,
  Group,
  Modal,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  Textarea,
  Stepper,
  Avatar,
  Container,
} from "@mantine/core";
import { useState, useEffect } from "react";
import useAppStore from "~/lib/stores/appStore";
import { useChatsStore } from "~/lib/stores/chatsStore";
import { useToolsStore } from "~/lib/stores/toolsStore";
import { FormProvider, useForm } from "~/lib/ContextForm";
import ToolkitSelectorList, {
  buildToolkitsFromConnections,
} from "~/pages/chats/components/ToolkitSelectorList";

interface CreateAgentProps {
  /** When inside agent picker modal, parent closes it before opening this modal */
  closeAgentPicker?: (open: boolean) => void;
  /** Controlled mode: parent controls open state (use when rendered outside picker modal) */
  opened?: boolean;
  onClose?: () => void;
  /** When true, only render the modal (no trigger button); use with controlled opened/onClose */
  renderTriggerOnly?: boolean;
}

export default function CreateAgent({
  closeAgentPicker,
  opened: controlledOpened,
  onClose,
  renderTriggerOnly = false,
}: CreateAgentProps) {
  const { getUser, isMobile } = useAppStore();
  const user = getUser();
  const { agentModels, createUserAgent } = useChatsStore();
  const {
    connectedAccounts,
    loadConnectedAccounts,
    toolkitsData,
    loadToolkits,
    toolsByToolkit,
    toolsByToolkitLoading,
    loadToolsForToolkits,
  } = useToolsStore();

  const [internalOpened, setInternalOpened] = useState(false);
  const isControlled = controlledOpened !== undefined;
  const opened = isControlled ? controlledOpened : internalOpened;
  const setOpened = isControlled
    ? (value: boolean) => {
        if (!value) onClose?.();
      }
    : setInternalOpened;

  const [step, setStep] = useState(0);
  const form = useForm({
    initialValues: {
      name: "",
      selectedModelName: null as string | null,
      systemPrompt: "",
      tools: {} as Record<string, string[]>,
    },
  });

  const selectedModel = form.values.selectedModelName
    ? agentModels.find((m) => m.model_name === form.values.selectedModelName)
    : null;
  const selectedModelDisplayName = selectedModel
    ? (selectedModel.meta as { name?: string })?.name?.trim() ||
      selectedModel.model_name ||
      selectedModel.id
    : "";

  useEffect(() => {
    if (step === 2 && selectedModelDisplayName && !(form.values.name ?? "").trim()) {
      form.setFieldValue("name", selectedModelDisplayName);
    }
  }, [step, selectedModelDisplayName]);

  const toolkitsList = buildToolkitsFromConnections(connectedAccounts, toolkitsData?.items);

  useEffect(() => {
    if (step === 1) {
      void loadConnectedAccounts();
      void loadToolkits({ limit: 100 });
    }
  }, [step, loadConnectedAccounts, loadToolkits]);

  useEffect(() => {
    if (step === 1 && toolkitsList.length > 0) {
      void loadToolsForToolkits(toolkitsList.map((t) => t.slug));
    }
  }, [step, toolkitsList.length, loadToolsForToolkits]);

  const handleToolsChange = (toolkitSlug: string, toolSlugs: string[]) => {
    const prev =
      form.values.tools && typeof form.values.tools === "object" ? form.values.tools : {};
    form.setFieldValue("tools", { ...prev, [toolkitSlug]: toolSlugs });
  };

  const handleSubmit = () => {
    if (!user?.user?.id) return;
    const values = form.getValues();
    console.log(values);
    if (!values.selectedModelName || !(values.name ?? "").trim()) return;
    const toolsConfig =
      values.tools && typeof values.tools === "object" && !Array.isArray(values.tools)
        ? values.tools
        : {};
    const config = {
      settings: {
        tools: toolsConfig,
        systemPrompt: (values.systemPrompt ?? "").trim(),
      },
    };
    void (async () => {
      const created = await createUserAgent(
        user.user.id,
        values.name ?? "",
        values.selectedModelName as unknown as string,
        config
      );
      if (created) {
        setOpened(false);
        setStep(0);
      }
    })();
  };

  const resetStateAndOpen = () => {
    closeAgentPicker?.(false);
    if (!isControlled) setInternalOpened(true);
    setStep(0);
    form.reset();
  };

  return (
    <>
      {!renderTriggerOnly && (
        <Button size="xs" onClick={resetStateAndOpen}>
          Create Agent
        </Button>
      )}

      <Modal
        opened={opened}
        onClose={() => {
          if (isControlled) onClose?.();
          else setInternalOpened(false);
        }}
        title="Create Agent"
        fullScreen
      >
        <Container
          size="sm"
          p="xs"
          style={{ height: "calc(100vh - 80px)", display: "flex", flexDirection: "column" }}
        >
          <FormProvider form={form}>
            <Stack gap="md" style={{ flex: 1, minHeight: 0 }}>
              <Stepper active={step} onStepClick={setStep} size={isMobile ? "xs" : "sm"}>
                <Stepper.Step
                  label="Model"
                  description={isMobile ? undefined : "Select a base model"}
                />
                <Stepper.Step
                  label="Tools"
                  description={isMobile ? undefined : "Choose tools for your agent"}
                />
                <Stepper.Step
                  label="Details"
                  description={isMobile ? undefined : "Name & system prompt"}
                />
              </Stepper>

              <ScrollArea style={{ flex: 1, minHeight: 0 }} offsetScrollbars scrollbarSize={6}>
                {step === 0 && (
                  <Stack gap="sm" mt="sm">
                    {[...agentModels]
                      .sort((a, b) => (a.order ?? Number.POSITIVE_INFINITY) - (b.order ?? Number.POSITIVE_INFINITY))
                      .map((m) => {
                      const cfg = m.meta as {
                        name?: string;
                        description?: string;
                        owned_by?: string;
                        tags?: string[];
                        pricing?: { input?: string; output?: string };
                        context_window?: number;
                      } | null;
                      const isSelected = m.model_name === form.values.selectedModelName;
                      return (
                        <Card
                          key={m.id}
                          onClick={() => form.setFieldValue("selectedModelName", m.model_name)}
                          style={{
                            cursor: "pointer",
                            borderColor: isSelected ? "var(--mantine-color-blue-6)" : undefined,
                            backgroundColor: isSelected
                              ? "var(--mantine-color-blue-light)"
                              : undefined,
                          }}
                        >
                          <Stack gap={4}>
                            <Group justify="space-between" align="flex-start" wrap="nowrap">
                              <Group wrap="nowrap" gap="sm" style={{ minWidth: 0 }}>
                                <Avatar src={m.brand?.logo} radius="sm" size="md" color="blue">
                                  {(m.brand?.name || cfg?.owned_by || "?")[0].toUpperCase()}
                                </Avatar>
                                <Stack gap={0} style={{ minWidth: 0 }}>
                                  <Text fw={600} size="sm" truncate>
                                    {cfg?.name?.trim() || m.model_name || m.id}
                                  </Text>
                                  {(m.brand?.name ?? cfg?.owned_by) && (
                                    <Text size="xs" c="dimmed" truncate>
                                      {m.brand?.name ?? cfg?.owned_by}
                                    </Text>
                                  )}
                                </Stack>
                              </Group>
                            </Group>
                            <Group gap="xs">
                              {cfg?.pricing?.input && (
                                <Group gap="xs">
                                  <Text size="xs">Input:</Text>
                                  <Text size="xs" c="dimmed">
                                    {cfg.pricing.input}
                                  </Text>
                                </Group>
                              )}
                              {cfg?.pricing?.output && (
                                <Group gap="xs">
                                  <Text size="xs">Output:</Text>
                                  <Text size="xs" c="dimmed">
                                    {cfg.pricing.output}
                                  </Text>
                                </Group>
                              )}
                              {cfg?.context_window && (
                                <Group gap="xs">
                                  <Text size="xs">Context:</Text>
                                  <Text size="xs" c="dimmed">
                                    {cfg.context_window.toLocaleString()} tokens
                                  </Text>
                                </Group>
                              )}
                            </Group>
                            {cfg?.tags && cfg.tags.length > 0 && (
                              <Group gap="xs" mt={4}>
                                {cfg.tags.map((tag) => (
                                  <Badge key={tag} size="sm" variant="light" color="gray">
                                    {tag}
                                  </Badge>
                                ))}
                              </Group>
                            )}
                          </Stack>
                        </Card>
                      );
                    })}
                  </Stack>
                )}
                {step === 1 && (
                  <Stack gap="sm" mt="sm">
                    <Text size="sm" c="dimmed">
                      Select which tools from each connected toolkit the agent can use.
                    </Text>
                    <ToolkitSelectorList
                      toolkits={toolkitsList}
                      toolsByToolkit={Object.fromEntries(
                        Object.entries(toolsByToolkit).map(([slug, items]) => [
                          slug,
                          items.map((t) => ({ slug: t.slug, name: t.name })),
                        ])
                      )}
                      selectedTools={
                        form.values.tools && typeof form.values.tools === "object"
                          ? form.values.tools
                          : {}
                      }
                      onToolsChange={handleToolsChange}
                      loading={toolsByToolkitLoading}
                    />
                  </Stack>
                )}
                {step === 2 && (
                  <Stack gap="sm" mt="sm">
                    <TextInput
                      label="Agent name"
                      placeholder={selectedModelDisplayName || "My coding agent"}
                      {...form.getInputProps("name")}
                      required
                    />
                    <Textarea
                      label="System prompt"
                      placeholder="Optional instructions the agent should always follow"
                      minRows={3}
                      {...form.getInputProps("systemPrompt")}
                    />
                  </Stack>
                )}
              </ScrollArea>

              <Group justify="space-between" mt="md">
                {step === 0 && (
                  <>
                    <Button variant="default" onClick={() => setOpened(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => setStep(1)} disabled={!form.values.selectedModelName}>
                      Next
                    </Button>
                  </>
                )}
                {step === 1 && (
                  <>
                    <Button variant="default" onClick={() => setStep(0)}>
                      Back
                    </Button>
                    <Button onClick={() => setStep(2)}>Next</Button>
                  </>
                )}
                {step === 2 && (
                  <>
                    <Button variant="default" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={!form.values.name.trim() || !form.values.selectedModelName}
                    >
                      Create Agent
                    </Button>
                  </>
                )}
              </Group>
            </Stack>
          </FormProvider>
        </Container>
      </Modal>
    </>
  );
}

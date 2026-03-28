import { Button, Modal, ScrollArea, Stack, Container } from "@mantine/core";
import { useState } from "react";
import { useChatsStore } from "~/lib/stores/chatsStore";
import { AgentModelCard } from "~/shared/AgentModelCard";

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
  const agentModelsAll = useChatsStore((s) => s.agentModels);
  const textAgentModels = agentModelsAll.filter((m) => m?.model_type === "text");
  const { selectedModelName, setSelectedModelName } = useChatsStore();

  const [internalOpened, setInternalOpened] = useState(false);
  const isControlled = controlledOpened !== undefined;
  const opened = isControlled ? controlledOpened : internalOpened;
  const setOpened = isControlled
    ? (value: boolean) => {
        if (!value) onClose?.();
      }
    : setInternalOpened;

  const resetStateAndOpen = () => {
    closeAgentPicker?.(false);
    if (!isControlled) setInternalOpened(true);
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
        title="Select Model"
        fullScreen
      >
        <Container
          size="sm"
          p="xs"
          style={{ height: "calc(100vh - 80px)", display: "flex", flexDirection: "column" }}
        >
          <Stack gap="md" style={{ flex: 1, minHeight: 0 }}>
            <ScrollArea style={{ flex: 1, minHeight: 0 }} offsetScrollbars scrollbarSize={6}>
              <Stack gap="sm" mt="sm">
                {[...textAgentModels]
                  .sort(
                    (a, b) =>
                      (a.order ?? Number.POSITIVE_INFINITY) - (b.order ?? Number.POSITIVE_INFINITY)
                  )
                  .map((m) => {
                    const isSelected = m.model_name === selectedModelName;
                    return (
                      <AgentModelCard
                        key={m.id}
                        model={m as any}
                        isSelected={isSelected}
                        onSelect={() => {
                          setSelectedModelName(m.model_name);
                          setOpened(false);
                        }}
                      />
                    );
                  })}
              </Stack>
            </ScrollArea>
            <Button variant="default" onClick={() => setOpened(false)}>
              Close
            </Button>
          </Stack>
        </Container>
      </Modal>
    </>
  );
}

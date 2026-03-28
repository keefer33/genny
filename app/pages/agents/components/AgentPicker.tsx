import {
  Card,
  Group,
  Modal,
  ScrollArea,
  Stack,
  Text,
  Avatar,
  useMantineColorScheme,
} from "@mantine/core";
import { RiArrowDownSLine } from "@remixicon/react";
import { useChatsStore, type AgentModel } from "~/lib/stores/chatsStore";
import useAppStore from "~/lib/stores/appStore";
import { AgentModelCard } from "~/shared/AgentModelCard";

const LS_SELECTED_MODEL = "genny:selectedModelName";

export default function AgentPicker() {
  const { isMobile } = useAppStore();
  const agentModels = useChatsStore((s) => s.agentModels);
  const textModels = agentModels.filter((m) => m?.model_type === "text");
  const { selectedModelName, agentPickerOpen, setAgentPickerOpen, setSelectedModelName } =
    useChatsStore();
  const { colorScheme } = useMantineColorScheme();
  const selectedModel = selectedModelName
    ? (textModels.find((m) => m.model_name === selectedModelName) ?? null)
    : null;
  const selectedBrandObj = selectedModel?.brand_name ?? null;
  const selectedBrand = selectedBrandObj?.name ?? null;
  const selectedTitle = selectedModel?.model_name ?? "Select model";
  const handlePickModel = (modelName: string) => {
    setSelectedModelName(modelName);
    window.localStorage.setItem(LS_SELECTED_MODEL, modelName);
    setAgentPickerOpen(false);
  };

  return (
    <>
      <Group align="center" wrap="nowrap" gap="xs" w="100%" pb="md">
        <Card
          padding=""
          radius="md"
          style={{
            minWidth: 0,
            flex: isMobile ? 1 : undefined,
            width: isMobile ? undefined : "100%",
          }}
          bg={
            colorScheme === "dark" ? "var(--mantine-color-dark-5)" : "var(--mantine-color-gray-2)"
          }
        >
          <Group
            gap="sm"
            justify="space-between"
            align="center"
            wrap="nowrap"
            w="100%"
            style={{ minWidth: 0, cursor: "pointer" }}
            onClick={() => setAgentPickerOpen(true)}
            p="4px"
          >
            <Group gap="xs" style={{ flex: 1, minWidth: 0 }} wrap="nowrap">
              <Avatar src={selectedModel?.brand_name?.logo ?? ""} size="sm" radius="md" />
              <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                <Text size="sm" fw={600} truncate>
                  {selectedTitle}
                </Text>
                <Text size="xs" truncate>
                  {selectedBrand || "Model"}
                </Text>
              </Stack>
            </Group>
            <RiArrowDownSLine size={20} style={{ flexShrink: 0 }} />
          </Group>
        </Card>
      </Group>

      <Modal
        opened={agentPickerOpen}
        onClose={() => setAgentPickerOpen(false)}
        title="Select model"
        size="sm"
        radius="md"
        scrollAreaComponent={ScrollArea.Autosize}
      >
        <Stack gap="sm" mt="sm">
          {[...textModels]
            .sort(
              (a, b) =>
                (a.order ?? Number.POSITIVE_INFINITY) - (b.order ?? Number.POSITIVE_INFINITY)
            )
            .map((m) => {
              const isSelected = m.model_name === selectedModelName;
              return (
                <AgentModelCard
                  key={m.id}
                  model={m as unknown as AgentModel}
                  isSelected={isSelected}
                  onSelect={() => handlePickModel(m.model_name)}
                />
              );
            })}
        </Stack>
      </Modal>
    </>
  );
}

import { Stack } from "@mantine/core";
import AgentPicker from "~/pages/agents/components/AgentPicker";
import ChatsList from "~/pages/agents/components/ChatsList";
import useAppStore from "~/lib/stores/appStore";

export default function AgentsSidebar() {
  const { isMobile } = useAppStore();

  return (
    <Stack gap="md" p="0">
      <AgentPicker />
      {!isMobile && <ChatsList />}
    </Stack>
  );
}

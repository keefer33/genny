import { Card, Group, Loader, Stack } from "@mantine/core";
import { useParams } from "react-router";
import useVoicesStore from "~/lib/stores/voicesStore";
import { VoiceActionModals } from "~/pages/voices/components/VoiceActionModals";
import { VoiceCard } from "~/pages/voices/components/VoiceCard";
import { GenerateSpeechForm } from "~/shared/GenerateSpeechForm";

export function meta() {
  return [{ title: "Voice" }];
}

export default function VoiceDetail() {
  const { voiceId } = useParams<{ voiceId: string }>();
  const id = voiceId?.trim() ?? "";
  const selectedVoice = useVoicesStore((s) => s.selectedVoice);
  const voiceReady = Boolean(id && selectedVoice?.id === id);

  return (
    <Stack gap="md" p="xs" pb="md">
      {!voiceReady ? (
        <Group justify="center" py="xl">
          <Loader size="sm" />
        </Group>
      ) : (
        <>
          <VoiceCard voice={selectedVoice!} />
          <Card withBorder padding="md" radius="md">
            <GenerateSpeechForm description="" />
          </Card>
        </>
      )}
      <VoiceActionModals />
    </Stack>
  );
}

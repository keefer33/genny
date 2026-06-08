import { Box, Button, Group, Loader, Menu, ScrollArea, Stack, Text, Title } from "@mantine/core";
import { RiAddLine, RiArrowDownSLine, RiCheckLine, RiMicLine } from "@remixicon/react";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router";
import useAppStore from "~/lib/stores/appStore";
import useVoicesStore from "~/lib/stores/voicesStore";
import { voiceMetaLine } from "~/pages/voices/voiceUtils";

type VoicePickerProps = {
  selectedVoiceId?: string;
};

export default function VoicePicker({ selectedVoiceId }: VoicePickerProps) {
  const navigate = useNavigate();
  const userId = useAppStore((s) => s.getUser()?.user?.id ?? "");
  const userVoices = useVoicesStore((s) => s.userVoices);
  const userVoicesLoading = useVoicesStore((s) => s.userVoicesLoading);
  const loadUserVoices = useVoicesStore((s) => s.loadUserVoices);

  const selectedVoice = userVoices.find((v) => v.id === selectedVoiceId) ?? null;

  useEffect(() => {
    if (!userId) return;
    void loadUserVoices(userId);
  }, [userId, loadUserVoices]);

  return (
    <Stack gap="sm">
      <Group justify="space-between" align="center">
        <Group gap="xs">
          <RiMicLine size={18} />
          <Title order={5}>Voices</Title>
        </Group>
        <Button
          component={Link}
          to="/voices"
          size="xs"
          variant="light"
          leftSection={<RiAddLine size={14} />}
        >
          Manage
        </Button>
      </Group>

      <Box>
        <Menu position="bottom-start" withinPortal shadow="md" width="target">
          <Menu.Target>
            <Button
              variant="default"
              fullWidth
              rightSection={<RiArrowDownSLine size={26} />}
              aria-label="Select voice"
              styles={{ label: { width: "100%" } }}
              h={50}
            >
              {selectedVoice ? (
                <Group
                  gap="sm"
                  wrap="nowrap"
                  justify="start"
                  align="center"
                  style={{ minWidth: 0 }}
                >
                  <Box
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 6,
                      overflow: "hidden",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "left",
                      padding: 4,
                    }}
                  >
                    <RiMicLine size={22} style={{ opacity: 0.5 }} />
                  </Box>
                  <Stack gap={0} style={{ minWidth: 0, flex: 1 }}>
                    <Text size="sm" fw={600} truncate>
                      {selectedVoice.name || "Untitled voice"}
                    </Text>
                    <Text size="xs" c="dimmed" truncate>
                      {voiceMetaLine(selectedVoice) || "No details"}
                    </Text>
                  </Stack>
                </Group>
              ) : (
                "Select voice"
              )}
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            {userVoicesLoading && userVoices.length === 0 ? (
              <Group justify="center" py="sm">
                <Loader size="sm" />
              </Group>
            ) : userVoices.length === 0 ? (
              <Menu.Item component={Link} to="/voices">
                No voices yet — create one
              </Menu.Item>
            ) : (
              <ScrollArea.Autosize mah={280} type="auto" offsetScrollbars="y">
                <Stack gap={0}>
                  {userVoices.map((voice) => {
                    const selected = voice.id === selectedVoiceId;
                    return (
                      <Menu.Item
                        key={voice.id}
                        onClick={() => navigate(`/voices/${encodeURIComponent(voice.id)}`)}
                        leftSection={
                          <Box
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 6,
                              flexShrink: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <RiMicLine size={14} style={{ opacity: 0.5 }} />
                          </Box>
                        }
                        rightSection={selected ? <RiCheckLine size={16} aria-hidden /> : undefined}
                      >
                        <Stack gap={0}>
                          <Text size="sm" fw={600} lineClamp={1}>
                            {voice.name || "Untitled voice"}
                          </Text>
                          <Text size="xs" c="dimmed" lineClamp={1}>
                            {voiceMetaLine(voice) || "No details"}
                          </Text>
                        </Stack>
                      </Menu.Item>
                    );
                  })}
                </Stack>
              </ScrollArea.Autosize>
            )}
          </Menu.Dropdown>
        </Menu>
      </Box>
    </Stack>
  );
}

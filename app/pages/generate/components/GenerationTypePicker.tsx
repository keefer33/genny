import { Group, SegmentedControl } from "@mantine/core";
import { RiImageAiLine, RiVideoAiLine, RiVoiceAiLine } from "@remixicon/react";
import type { ComponentType } from "react";
import { useLocation, useNavigate } from "react-router";
import useAppStore from "~/lib/stores/appStore";
import PlayGroundRunHistoryModalAction from "~/pages/generations/components/PlayGroundRunHistoryModalAction";

type GenerationTypeKey = "image" | "video" | "audio";

type GenerationTypeItem = {
  key: GenerationTypeKey;
  label: string;
  icon: ComponentType<{ size?: string | number }>;
  to: string;
  isActive: boolean;
};

const ROUTE_BY_KEY: Record<GenerationTypeKey, string> = {
  image: "/generate/image",
  video: "/generate/video",
  audio: "/generate/audio",
};

export default function GenerationTypePicker() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile, themeSettings } = useAppStore();
  const themeColor = themeSettings.themeColor;

  const items: GenerationTypeItem[] = [
    {
      key: "image",
      label: "Image",
      icon: RiImageAiLine,
      to: ROUTE_BY_KEY.image,
      isActive: location.pathname.startsWith("/generate/image"),
    },
    {
      key: "video",
      label: "Video",
      icon: RiVideoAiLine,
      to: ROUTE_BY_KEY.video,
      isActive: location.pathname.startsWith("/generate/video"),
    },
    {
      key: "audio",
      label: "Audio",
      icon: RiVoiceAiLine,
      to: ROUTE_BY_KEY.audio,
      isActive: location.pathname.startsWith("/generate/audio"),
    },
  ];

  const activeKey = items.find((item) => item.isActive)?.key;
  const segmentedValue = activeKey ?? "__none__";

  return (
    <Group gap="xs" justify="space-between" align="center" wrap="nowrap" px="xs">
      <SegmentedControl
        style={{ flex: 1 }}
        radius="sm"
        size="sm"
        color={themeColor}
        value={segmentedValue}
        onChange={(value) => {
          const next = ROUTE_BY_KEY[value as GenerationTypeKey];
          if (next) navigate(next);
        }}
        transitionDuration={220}
        data={items.map((item) => {
          const Icon = item.icon;
          const isActive = activeKey === item.key;
          return {
            value: item.key,
            label: (
              <Group gap={2} align="center" justify="center" wrap="nowrap">
                <Icon />
                {isActive && item.label}
              </Group>
            ),
          };
        })}
      />
      {isMobile ? <PlayGroundRunHistoryModalAction title="Run history" button /> : null}
    </Group>
  );
}

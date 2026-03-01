import { Group, SegmentedControl, Text } from "@mantine/core";
import { RiHistoryLine, RiImageLine, RiRobot2Line, RiVideoLine } from "@remixicon/react";
import { useLocation, useNavigate } from "react-router";
import type { ComponentType } from "react";
import useAppStore from "~/lib/stores/appStore";
import useGenerateStore from "~/lib/stores/generateStore";

export const MOBILE_GLOBAL_NAV_HEIGHT = 65;

type GlobalNavItem = {
  key: "generate" | "image" | "video" | "generations";
  label: string;
  icon: ComponentType<{ size?: string | number }>;
  to: string;
  isActive: boolean;
};

export function MobileFooterGlobalNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { getUser, themeColor } = useAppStore();
  const { models } = useGenerateStore();

  const user = getUser();

  const resolveModelRoute = (generationType: "image" | "video") => {
    const orderedModelsForType = (models || []).filter(
      (model) => model.generation_type === generationType
    );
    if (orderedModelsForType.length > 0) {
      return `/generate/${generationType}/${orderedModelsForType[0].slug}`;
    }
    return `/generate/${generationType}`;
  };

  const items: GlobalNavItem[] = [
    {
      key: "generate",
      label: "Generate",
      icon: RiRobot2Line,
      to: "/generate",
      isActive: location.pathname === "/generate",
    },
    {
      key: "image",
      label: "Image",
      icon: RiImageLine,
      to: resolveModelRoute("image"),
      isActive: location.pathname.startsWith("/generate/image"),
    },
    {
      key: "video",
      label: "Video",
      icon: RiVideoLine,
      to: resolveModelRoute("video"),
      isActive: location.pathname.startsWith("/generate/video"),
    },
    {
      key: "generations",
      label: "Generations",
      icon: RiHistoryLine,
      to: "/generations",
      isActive: location.pathname.startsWith("/generations"),
    },
  ];

  const activeKey = items.find((item) => item.isActive)?.key;
  const segmentedValue = activeKey ?? "__none__";
  const routeByKey = items.reduce<Record<GlobalNavItem["key"], string>>(
    (acc, item) => ({ ...acc, [item.key]: item.to }),
    {
      generate: "/generate",
      image: "/generate/image",
      video: "/generate/video",
      generations: "/generations",
    }
  );

  return (
    <SegmentedControl
      w="100%"
      radius="md"
      size="xl"
      color={themeColor}
      value={segmentedValue}
      onChange={(value) => {
        const next = routeByKey[value as GlobalNavItem["key"]];
        if (next) navigate(next);
      }}
      transitionDuration={220}
      data={items.map((item) => {
        const Icon = item.icon;
        const isActive = activeKey === item.key;
        return {
          value: item.key,
          label: (
            <Group gap={6} align="center" justify="center" wrap="nowrap">
              <Icon size={18} />
              {isActive && (
                <Text size="xs" fw={600}>
                  {item.label}
                </Text>
              )}
            </Group>
          ),
        };
      })}
    />
  );
}

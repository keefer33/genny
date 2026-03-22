import { Group, SegmentedControl } from "@mantine/core";
import { RiHistoryLine, RiImageLine, RiRobot2Line, RiVideoLine } from "@remixicon/react";
import { useLocation, useNavigate } from "react-router";
import type { ComponentType } from "react";
import useAppStore from "~/lib/stores/appStore";

export const MOBILE_GLOBAL_NAV_HEIGHT = 55;

type GlobalNavItem = {
  key: "agents" | "image" | "video" | "generations";
  label: string;
  icon: ComponentType<{ size?: string | number }>;
  to: string;
  isActive: boolean;
};

export function MobileFooterGlobalNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { themeColor } = useAppStore();

  const items: GlobalNavItem[] = [
    {
      key: "agents",
      label: "Agents",
      icon: RiRobot2Line,
      to: "/agents",
      isActive: location.pathname === "/agents",
    },
    {
      key: "image",
      label: "Image",
      icon: RiImageLine,
      to: "/generate/image",
      isActive: location.pathname === "/generate/image",
    },
    {
      key: "video",
      label: "Video",
      icon: RiVideoLine,
      to: "/generate/video",
      isActive: location.pathname === "/generate/video",
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
      agents: "/agents",
      image: "/generate/image",
      video: "/generate/video",
      generations: "/generations",
    }
  );

  return (
    <SegmentedControl
      w="100%"
      radius="sm"
      size="md"
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
              <Icon />
              {isActive && item.label}
            </Group>
          ),
        };
      })}
    />
  );
}

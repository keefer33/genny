import { Group, SegmentedControl } from "@mantine/core";
import {
  RiDashboardLine,
  RiHistoryLine,
  RiHomeLine,
  RiImageAiLine,
  RiLoginBoxLine,
  RiVideoAiLine,
} from "@remixicon/react";
import { useLocation, useNavigate } from "react-router";
import type { ComponentType } from "react";
import useAppStore from "~/lib/stores/appStore";

export const MOBILE_GLOBAL_NAV_HEIGHT = 55;

type GlobalNavItem = {
  key:
    | "agents"
    | "playground"
    | "generations"
    | "dashboard"
    | "image-generator"
    | "video-generator";
  label: string;
  icon: ComponentType<{ size?: string | number }>;
  to: string;
  isActive: boolean;
};

export function MobileFooterGlobalNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { themeSettings, getUser } = useAppStore();
  const themeColor = themeSettings.themeColor;
  const isLoggedIn = !!getUser()?.user?.id;

  const items: GlobalNavItem[] = [
    {
      key: "dashboard",
      label: isLoggedIn ? "Dashboard" : "Home",
      icon: isLoggedIn ? RiDashboardLine : RiHomeLine,
      to: isLoggedIn ? "/dashboard" : "/",
      isActive: isLoggedIn ? location.pathname === "/dashboard" : location.pathname === "/",
    },
    {
      key: "image-generator",
      label: "Images",
      icon: RiImageAiLine,
      to: "/generate/image",
      isActive: location.pathname.startsWith("/generate/image"),
    },
    {
      key: "video-generator",
      label: "Videos",
      icon: RiVideoAiLine,
      to: "/generate/video",
      isActive: location.pathname.startsWith("/generate/video"),
    },
    {
      key: "generations",
      label: isLoggedIn ? "Generations" : "Login",
      icon: isLoggedIn ? RiHistoryLine : RiLoginBoxLine,
      to: isLoggedIn ? "/generations" : "/login",
      isActive: isLoggedIn
        ? location.pathname.startsWith("/generations")
        : location.pathname === "/login",
    },
  ];

  const activeKey = items.find((item) => item.isActive)?.key;
  const segmentedValue = activeKey ?? "__none__";
  const routeByKey = items.reduce<Record<GlobalNavItem["key"], string>>(
    (acc, item) => ({ ...acc, [item.key]: item.to }),
    {
      dashboard: "/dashboard",
      agents: "/agents",
      "image-generator": "/image-generator",
      "video-generator": "/video-generator",
      generations: "/generations",
    } as Record<GlobalNavItem["key"], string>
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

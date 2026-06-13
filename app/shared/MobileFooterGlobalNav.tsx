import { Group, SegmentedControl } from "@mantine/core";
import {
  RiChatAi2Line,
  RiDashboardLine,
  RiHistoryLine,
  RiHomeLine,
  RiLoginBoxLine,
  RiAiGenerate2,
  RiTeamLine,
} from "@remixicon/react";
import { useLocation, useNavigate } from "react-router";
import type { ComponentType } from "react";
import useAppStore from "~/lib/stores/appStore";

export const MOBILE_GLOBAL_NAV_HEIGHT = 55;

type GlobalNavItem = {
  key: "agents" | "playground" | "generations" | "dashboard" | "playground" | "characters";
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
      label: isLoggedIn ? "Dash" : "Home",
      icon: isLoggedIn ? RiDashboardLine : RiHomeLine,
      to: isLoggedIn ? "/dashboard" : "/",
      isActive: isLoggedIn ? location.pathname === "/dashboard" : location.pathname === "/",
    },
    {
      key: "agents",
      label: "Agents",
      icon: RiChatAi2Line,
      to: "/agents",
      isActive: location.pathname.startsWith("/agents"),
    },
    {
      key: "playground",
      label: "Playground",
      icon: RiAiGenerate2,
      to: "/generate",
      isActive: location.pathname.startsWith("/generate"),
    },
    {
      key: "characters",
      label: "Characters",
      icon: RiTeamLine,
      to: "/characters",
      isActive: location.pathname.startsWith("/characters"),
    },
    {
      key: "generations",
      label: isLoggedIn ? "History" : "Login",
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
      characters: "/characters",
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
            <Group gap={2} align="center" justify="center" wrap="nowrap">
              <Icon />
              {isActive && item.label}
            </Group>
          ),
        };
      })}
    />
  );
}

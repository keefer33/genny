import {
  Stack,
  useMantineTheme,
  UnstyledButton,
  Tooltip,
  Group,
  Text,
  Divider,
} from "@mantine/core";
import {
  RiFolder2Line,
  RiDashboardLine,
  RiLoginBoxLine,
  RiHistoryLine,
  RiUserLine,
  RiMoneyDollarBoxLine,
  RiLogoutBoxLine,
  RiCoinLine,
  RiCustomerService2Line,
  RiImageAiLine,
  RiVideoAiLine,
  RiVoiceAiLine,
  RiToolsLine,
  RiChatAi2Line,
} from "@remixicon/react";
import { NavLink, useLocation } from "react-router";
import useAppStore from "~/lib/stores/appStore";
import { CurrentBalance } from "./CurrentBalance";

interface NavbarProps {
  toggleMobile: () => void;
  collapsed: boolean;
  toggleCollapsed: () => void;
}

export function Navbar({ toggleMobile, collapsed }: NavbarProps) {
  const theme = useMantineTheme();
  const location = useLocation();
  const { getUser, isMobile, themeSettings } = useAppStore();

  const user = getUser();
  const isLoggedIn = !!user?.user?.id;

  const navItems = [
    {
      to: "/dashboard",
      icon: RiDashboardLine,
      label: "Dashboard",
      description: "Your activity & stats",
      matchPrefix: "/dashboard",
    },
    {
      to: "generate/image",
      icon: RiImageAiLine,
      label: "Images",
      description: "Image Generator",
      matchPrefix: "/generate/image",
    },
    {
      to: "/generate/video",
      icon: RiVideoAiLine,
      label: "Videos",
      description: "Video Generator",
      matchPrefix: "/generate/video",
    },
    {
      to: "/generate/audio",
      icon: RiVoiceAiLine,
      label: "Audio",
      description: "Audio Generator",
      matchPrefix: "/generate/audio",
    },
    {
      to: "/generations",
      icon: RiHistoryLine,
      label: "Generations",
      description: "Generation History",
    },
    {
      to: "/agents",
      icon: RiChatAi2Line,
      label: "Agents",
      description: "Agents",
    },
    {
      to: "/tools",
      icon: RiToolsLine,
      label: "Tools",
      description: "Toolkits",
    },
    // Add login item if not logged in
    ...(!isLoggedIn
      ? [
          {
            to: "/login",
            icon: RiLoginBoxLine,
            label: "Sign In",
            description: "Sign in to your account",
          },
        ]
      : []),
  ];

  const loggedInItems = [
    {
      to: "/account/profile",
      icon: RiUserLine,
      label: "Profile",
      description: "Profile",
    },
    {
      to: "/files",
      icon: RiFolder2Line,
      label: "Files",
      description: "File Management",
    },
    {
      to: "/account/usage-log",
      icon: RiCoinLine,
      label: "Usage",
      description: "Usage history",
    },
    {
      to: "/account/billing",
      icon: RiMoneyDollarBoxLine,
      label: "Billing",
      description: "Billing",
    },
    {
      to: "/account/support",
      icon: RiCustomerService2Line,
      label: "Support",
      description: "Support tickets",
      matchPrefix: "/account/support",
    },
    {
      to: "/login",
      icon: RiLogoutBoxLine,
      label: "Logout",
      description: "Logout from your account",
    },
  ];

  const NavItem = ({
    item,
  }: {
    item: (typeof navItems)[number] | (typeof loggedInItems)[number];
  }) => {
    const IconComponent = item.icon;
    const isActive = item.matchPrefix
      ? location.pathname.startsWith(item.matchPrefix)
      : location.pathname === item.to;

    // On mobile, always show full text. On desktop, respect collapsed state
    const shouldShowLabel = isMobile || !collapsed;

    const navButton = (
      <UnstyledButton
        component={NavLink}
        to={item.to}
        onClick={toggleMobile}
        style={{
          width: "100%",
          padding: isMobile ? "10px 10px" : "6px 6px",
          borderRadius: theme.radius.sm,
          backgroundColor: isActive
            ? themeSettings.colorScheme === "dark"
              ? theme.colors[theme.primaryColor][8]
              : theme.colors[theme.primaryColor][1]
            : "transparent",
          color: isActive
            ? themeSettings.colorScheme === "dark"
              ? theme.colors[theme.primaryColor][2]
              : theme.colors[theme.primaryColor][8]
            : themeSettings.colorScheme === "dark"
              ? theme.colors.gray[0]
              : theme.colors.gray[7],
          transition: "all 0.2s ease",
          fontSize: isMobile ? "16px" : "14px",
          fontWeight: isActive ? 600 : 400,
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor =
              themeSettings.colorScheme === "dark" ? theme.colors.dark[6] : theme.colors.gray[1];
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = "transparent";
          }
        }}
      >
        <Group
          gap={isMobile ? "md" : "sm"}
          justify={collapsed && !isMobile ? "center" : "flex-start"}
          align="center"
        >
          <IconComponent size={isMobile ? 24 : 24} />

          {shouldShowLabel && (
            <Text size={isMobile ? "md" : "sm"} fw={isActive ? 600 : 400}>
              {item.label}
            </Text>
          )}
        </Group>
      </UnstyledButton>
    );

    // Only show tooltip on desktop when collapsed
    if (!isMobile && collapsed) {
      return (
        <Tooltip label={item.label} position="right" withArrow>
          {navButton}
        </Tooltip>
      );
    }

    return navButton;
  };

  return (
    <Stack gap="sm" p={isMobile ? "md" : "xs"}>
      {isLoggedIn && isMobile && (
        <>
          <CurrentBalance />
          <Divider my="sm" />
        </>
      )}
      {navItems.map((item, index) => (
        <NavItem key={index} item={item} />
      ))}
      {isLoggedIn && (
        <>
          <Divider my="sm" />
          {loggedInItems.map((item, index) => (
            <NavItem key={index} item={item} />
          ))}
        </>
      )}
    </Stack>
  );
}

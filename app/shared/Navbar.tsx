import {
  Stack,
  useMantineTheme,
  UnstyledButton,
  Tooltip,
  Group,
  Text,
  useMantineColorScheme,
  Divider,
} from "@mantine/core";
import {
  RiFolder2Line,
  RiRobot2Line,
  RiImageLine,
  RiVideoLine,
  RiLoginBoxLine,
  RiHistoryLine,
  RiUserLine,
  RiMoneyDollarBoxLine,
  RiLogoutBoxLine,
  RiCoinLine,
  RiCustomerService2Line,
  RiChatSmile2Line,
  RiToolsLine,
} from "@remixicon/react";
import { NavLink, useLocation } from "react-router";
import useAppStore from "~/lib/stores/appStore";
import useGenerateStore from "~/lib/stores/generateStore";
import { CurrentBalance } from "./CurrentBalance";

interface NavbarProps {
  toggleMobile: () => void;
  collapsed: boolean;
  toggleCollapsed: () => void;
}

export function Navbar({ toggleMobile, collapsed }: NavbarProps) {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const location = useLocation();
  const { getUser, isMobile } = useAppStore();
  const { models } = useGenerateStore();

  const user = getUser();
  const isLoggedIn = !!user?.user?.id;

  const resolveModelRoute = (generationType: "image" | "video") => {
    const orderedModelsForType = (models || []).filter(
      (model) => model.generation_type === generationType
    );
    if (orderedModelsForType.length > 0) {
      return `/generate/${generationType}/${orderedModelsForType[0].slug}`;
    }
    return `/generate/${generationType}`;
  };

  const navItems = [
    {
      to: "/generate",
      icon: RiRobot2Line,
      label: "Generate",
      description: "AI Content Generation",
    },
    {
      to: resolveModelRoute("image"),
      icon: RiImageLine,
      label: "Images",
      description: "Image Generation",
      matchPrefix: "/generate/image",
    },
    {
      to: resolveModelRoute("video"),
      icon: RiVideoLine,
      label: "Videos",
      description: "Video Generation",
      matchPrefix: "/generate/video",
    },
    {
      to: "/generations",
      icon: RiHistoryLine,
      label: "Generations",
      description: "Generation History",
    },
    {
      to: "/files",
      icon: RiFolder2Line,
      label: "Files",
      description: "File Management",
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
      to: "/chats",
      icon: RiChatSmile2Line,
      label: "Chats",
      description: "AI chats",
      matchPrefix: "/chats",
    },
    {
      to: "/tools",
      icon: RiToolsLine,
      label: "Tools",
      description: "Connect toolkits (Composio)",
      matchPrefix: "/tools",
    },
    {
      to: "/account/tokens-log",
      icon: RiCoinLine,
      label: "Tokens",
      description: "Token usage history",
    },
    {
      to: "/account/billing",
      icon: RiMoneyDollarBoxLine,
      label: "Billing",
      description: "Billing",
    },
    {
      to: "/account/profile",
      icon: RiUserLine,
      label: "Profile",
      description: "Profile",
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
            ? colorScheme === "dark"
              ? theme.colors[theme.primaryColor][8]
              : theme.colors[theme.primaryColor][1]
            : "transparent",
          color: isActive
            ? colorScheme === "dark"
              ? theme.colors[theme.primaryColor][2]
              : theme.colors[theme.primaryColor][8]
            : colorScheme === "dark"
              ? theme.colors.gray[0]
              : theme.colors.gray[7],
          transition: "all 0.2s ease",
          fontSize: isMobile ? "16px" : "14px",
          fontWeight: isActive ? 600 : 400,
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor =
              colorScheme === "dark" ? theme.colors.dark[6] : theme.colors.gray[1];
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

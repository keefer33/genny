import { notifications } from "@mantine/notifications";

type NotificationType = "info" | "success" | "error" | "warning" | "loading";

interface NotificationOptions {
  title?: string;
  message: string;
  type?: NotificationType;
  autoClose?: number | false;
  withCloseButton?: boolean;
  icon?: React.ReactNode;
}

/**
 * Default notification settings by type
 */
const notificationDefaults: Record<NotificationType, Partial<NotificationOptions>> = {
  info: {
    title: "Information",
    autoClose: 3000,
    withCloseButton: true,
  },
  success: {
    title: "Success",
    autoClose: 3000,
    withCloseButton: true,
  },
  error: {
    title: "Error",
    autoClose: 5000,
    withCloseButton: true,
  },
  warning: {
    title: "Warning",
    autoClose: 4000,
    withCloseButton: true,
  },
  loading: {
    title: "Processing",
    autoClose: false,
    withCloseButton: false,
  },
};

/**
 * Map notification types to Mantine colors
 */
const typeToColor: Record<NotificationType, string> = {
  info: "blue",
  success: "green",
  error: "red.5",
  warning: "yellow",
  loading: "cyan",
};

/**
 * Show a notification with the given options
 */
export const showNotification = (options: NotificationOptions): string => {
  const type = options.type || "info";
  const defaults = notificationDefaults[type];

  return notifications.show({
    title: options.title || defaults.title,
    message: options.message,
    color: typeToColor[type],
    loading: type === "loading",
    autoClose: options.autoClose !== undefined ? options.autoClose : defaults.autoClose,
    withCloseButton:
      options.withCloseButton !== undefined ? options.withCloseButton : defaults.withCloseButton,
    icon: options.icon,
  });
};

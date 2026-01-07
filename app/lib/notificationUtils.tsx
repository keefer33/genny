import { notifications } from "@mantine/notifications";

export type NotificationType = "info" | "success" | "error" | "warning" | "loading";

export interface NotificationOptions {
  title?: string;
  message: string;
  type?: NotificationType;
  autoClose?: number | false;
  withCloseButton?: boolean;
  icon?: React.ReactNode;
}

export interface NotificationUpdateOptions extends NotificationOptions {
  id: string;
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

/**
 * Update an existing notification
 */
export const updateNotification = (options: NotificationUpdateOptions): void => {
  const type = options.type || "info";
  const defaults = notificationDefaults[type];

  notifications.update({
    id: options.id,
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

/**
 * Show a loading notification that can be updated later
 */
export const showLoadingNotification = (message: string, title?: string): string => {
  return showNotification({
    title: title || "Processing",
    message,
    type: "loading",
  });
};

/**
 * Update a notification to show success
 */
export const updateToSuccess = (id: string, message: string, title?: string): void => {
  updateNotification({
    id,
    title: title || "Success",
    message,
    type: "success",
  });
};

/**
 * Update a notification to show error
 */
export const updateToError = (id: string, message: string, title?: string): void => {
  updateNotification({
    id,
    title: title || "Error",
    message,
    type: "error",
  });
};

/**
 * Handle API response with notification updates
 */
export const handleApiResponse = (
  response: any,
  notificationId: string,
  successMessage: string = "Operation completed successfully"
): void => {
  if (response?.error === true) {
    updateToError(notificationId, response.message || "Operation failed");
  } else {
    updateToSuccess(notificationId, response.message || successMessage);
  }
};

/**
 * Handle API error with notification updates
 */
export const handleApiError = (
  error: unknown,
  notificationId: string,
  defaultMessage: string = "An unexpected error occurred"
): void => {
  const errorMessage = error instanceof Error ? error.message : defaultMessage;
  updateToError(notificationId, errorMessage);
};

/**
 * Create a notification context for an API operation
 * Returns functions to update the notification based on the operation's progress
 */
export const createApiNotificationContext = (initialMessage: string, initialTitle?: string) => {
  const notificationId = showLoadingNotification(initialMessage, initialTitle);

  return {
    notificationId,
    success: (message: string, title?: string) => updateToSuccess(notificationId, message, title),
    error: (message: string, title?: string) => updateToError(notificationId, message, title),
    update: (options: Omit<NotificationUpdateOptions, "id">) =>
      updateNotification({ ...options, id: notificationId }),
    handleResponse: (response: any, successMessage?: string) =>
      handleApiResponse(response, notificationId, successMessage),
    handleError: (error: unknown, defaultMessage?: string) =>
      handleApiError(error, notificationId, defaultMessage),
  };
};

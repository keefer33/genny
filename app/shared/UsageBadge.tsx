import { Badge } from "@mantine/core";
import { RiCoinsLine } from "@remixicon/react";
import { usePaymentModal } from "./PaymentModal";

interface UsageBadgeProps {
  usage?: number;
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "light" | "filled" | "outline" | "dot" | "gradient" | "subtle" | "default";
  color?: string;
  leftSection?: React.ReactNode;
  clickable?: boolean;
}

export function UsageBadge({
  usage = 0,
  size = "lg",
  variant = "filled",
  color = "yellow.3",
  leftSection,
  clickable = true,
}: UsageBadgeProps) {
  const { openPaymentModal } = usePaymentModal();
  const handleClick = () => {
    openPaymentModal(null);
  };
  return (
    <Badge
      color={color}
      variant={variant}
      leftSection={leftSection || <RiCoinsLine size={18} />}
      size={size}
      component="span"
      style={clickable ? { cursor: "pointer" } : undefined}
      onClick={clickable ? handleClick : undefined}
    >
      {usage}
    </Badge>
  );
}

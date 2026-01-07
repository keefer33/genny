import { Badge } from "@mantine/core";
import { RiCoinLine } from "@remixicon/react";
import { usePaymentModal } from "./PaymentModal";

interface TokensBadgeProps {
  tokens?: number;
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "light" | "filled" | "outline" | "dot" | "gradient";
  color?: string;
  leftSection?: React.ReactNode;
  clickable?: boolean;
}

export function TokensBadge({
  tokens = 0,
  size = "lg",
  variant = "light",
  color = "yellow.5",
  leftSection,
  clickable = true,
}: TokensBadgeProps) {
  const { openPaymentModal } = usePaymentModal();
  if (tokens === 0) return null;

  const handleClick = () => {
    if (clickable) {
      openPaymentModal(null);
    }
  };

  return (
    <Badge
      color={color}
      variant={variant}
      leftSection={leftSection || <RiCoinLine size={18} />}
      size={size}
      component="span"
      style={clickable ? { cursor: "pointer" } : undefined}
      onClick={clickable ? handleClick : undefined}
    >
      {tokens}
    </Badge>
  );
}

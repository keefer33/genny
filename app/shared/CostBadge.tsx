import { Badge } from "@mantine/core";
import { RiCoinsLine } from "@remixicon/react";
import { usePaymentModal } from "./PaymentModal";

interface CostBadgeProps {
  cost?: number;
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "light" | "filled" | "outline" | "dot" | "gradient" | "subtle" | "default";
  color?: string;
  leftSection?: React.ReactNode;
  clickable?: boolean;
}
function formatCost(cost: number): string {
  const fixed = cost.toFixed(4);
  const [whole, decimal = "00"] = fixed.split(".");
  const base = decimal.slice(0, 2);
  const extra = decimal.slice(2).replace(/0+$/, "");
  return `${whole}.${base}${extra}`;
}

export function CostBadge({
  cost = 0,
  size = "lg",
  variant = "filled",
  color = "yellow.3",
  leftSection,
  clickable = true,
}: CostBadgeProps) {
  const { openPaymentModal } = usePaymentModal();
  const handleClick = () => {
    if (clickable) {
      openPaymentModal(null);
    }
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
      ${formatCost(cost)}
    </Badge>
  );
}

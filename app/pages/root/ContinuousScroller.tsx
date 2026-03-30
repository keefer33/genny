import { Box } from "@mantine/core";
import type { CSSProperties } from "react";
import { useMemo } from "react";

type ContinuousScrollerProps<T> = {
  items: T[];
  durationSeconds?: number;
  className?: string;
  renderItem: (item: T, index: number) => React.ReactNode;
  getItemKey?: (item: T, index: number) => string;
};

export function ContinuousScroller<T>({
  items,
  durationSeconds = 40,
  className,
  renderItem,
  getItemKey,
}: ContinuousScrollerProps<T>) {
  const loopItems = useMemo(() => [...items, ...items], [items]);

  return (
    <Box
      className={`continuous-scroller${className ? ` ${className}` : ""}`}
      style={{ "--scroll-duration": `${durationSeconds}s` } as CSSProperties}
    >
      <Box className="continuous-scroller__track">
        {loopItems.map((item, index) => (
          <Box
            key={getItemKey ? `${getItemKey(item, index % items.length)}-${index}` : `${index}`}
            className="continuous-scroller__item"
          >
            {renderItem(item, index)}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

import { useCallback, useRef } from "react";

/**
 * Scroll helpers for Mantine ScrollArea `viewportRef`.
 * Same pattern as slootai `useChatScroll`: imperative bottom/top with optional delay.
 */
export function useChatScroll() {
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const performScrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    const el = viewportRef.current;

    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight + 100,
      behavior,
    });
  }, []);

  const performScrollToTop = useCallback((behavior: ScrollBehavior = "auto") => {
    const el = viewportRef.current;
    if (!el) return;
    el.scrollTo({
      top: 0,
      behavior,
    });
  }, []);

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth", delay = 5) => {
      if (delay > 0) {
        window.setTimeout(() => performScrollToBottom(behavior), delay);
      } else {
        performScrollToBottom(behavior);
      }
    },
    [performScrollToBottom]
  );

  const scrollToTop = useCallback(
    (behavior: ScrollBehavior = "smooth", delay = 0) => {
      if (delay > 0) {
        window.setTimeout(() => performScrollToTop(behavior), delay);
      } else {
        performScrollToTop(behavior);
      }
    },
    [performScrollToTop]
  );

  return {
    viewportRef,
    scrollToBottom,
    scrollToTop,
  };
}

import { useLayoutEffect, useRef } from "react";

export function useChatScroll(messages: any[], onLoadMore?: () => void) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Tracks if we should snap to bottom when a new message arrives
  const shouldAutoScroll = useRef(true);
  // Tracks if the current update is from loading history (upward)
  const isLoadingOlder = useRef(false);
  // Prevents the initial jump from happening more than once
  const isInitialized = useRef(false);
  // Stores the position of the top-most message before prepending new ones
  const anchorOffset = useRef<number>(0);

  const onScroll = () => {
    const el = containerRef.current;
    if (!el) return;

    // Check if user is near the bottom within 150px
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    shouldAutoScroll.current = distanceFromBottom < 150;

    // Trigger Load More when reaching the top within 100px
    if (el.scrollTop < 100 && onLoadMore && !isLoadingOlder.current) {
      isLoadingOlder.current = true;
      
      anchorOffset.current = el.scrollHeight - el.scrollTop;

      onLoadMore();
    }
  };

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || messages.length === 0) return;

    // INITIAL SCROLL
    if (!isInitialized.current) {
      el.scrollTop = el.scrollHeight;
      isInitialized.current = true;
      return;
    }

    // RESTORE SCROLL
    if (isLoadingOlder.current) {
      // Logic: New scroll top = New total height - Old distance from bottom
      el.scrollTop = el.scrollHeight - anchorOffset.current;
      isLoadingOlder.current = false;
      return;
    }

    // AUTO-SCROLL
    if (shouldAutoScroll.current) {      
      requestAnimationFrame(() => {
        el.scrollTo({
          top: el.scrollHeight,
          behavior: "smooth" 
        });
      });
    }
  }, [messages]);

  return { containerRef, onScroll };
}
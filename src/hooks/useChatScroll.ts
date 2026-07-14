import { useLayoutEffect, useRef } from "react";

export function useChatScroll(messages: any[], onLoadMore?: () => void) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const shouldAutoScroll = useRef(true);
  const isLoadingOlder = useRef(false);
  const isInitialized = useRef(false);
  const anchorOffset = useRef<number>(0);

  const onScroll = () => {
    const el = containerRef.current;
    if (!el) return;

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    shouldAutoScroll.current = distanceFromBottom < 150;

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
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
      isInitialized.current = true;
      return;
    }

    // RESTORE SCROLL (Pagination)
    if (isLoadingOlder.current) {
      el.scrollTop = el.scrollHeight - anchorOffset.current;
      isLoadingOlder.current = false;
      return;
    }

    // AUTO-SCROLL (New incoming messages)
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
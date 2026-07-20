import { useLayoutEffect, useRef, useState, useCallback } from "react";

export function useChatScroll(
  messages: any[],
  onLoadMore?: () => void,
  initialFocusMessageId?: number | null
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const loadingOlder = useRef(false);
  const previousHeight = useRef(0);
  const prevMessagesLength = useRef(messages.length);

  const [isAtBottom, setIsAtBottom] = useState(!initialFocusMessageId);

  const onScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const currentScrollPosition = el.scrollTop + el.clientHeight;
    const totalContentHeight = el.scrollHeight;
    const bottom = Math.abs(totalContentHeight - currentScrollPosition) < 30;
    setIsAtBottom(bottom);

    if (el.scrollTop < 100 && onLoadMore && !loadingOlder.current && messages.length > 0) {
      loadingOlder.current = true;
      previousHeight.current = el.scrollHeight;
      onLoadMore();
    }
  }, [onLoadMore, messages.length]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Initial mount — jump to the last-seen message if we have one,
    // otherwise fall back to the bottom.
    if (!initialized.current && messages.length > 0) {
      initialized.current = true;

      const target = initialFocusMessageId
        ? el.querySelector(`[data-message-id="${initialFocusMessageId}"]`)
        : null;

      if (target) {
        target.scrollIntoView({ block: "center" });
        const pos = el.scrollTop + el.clientHeight;
        setIsAtBottom(Math.abs(el.scrollHeight - pos) < 30);
      } else {
        el.scrollTop = el.scrollHeight;
        setIsAtBottom(true);
      }

      prevMessagesLength.current = messages.length;
      return;
    }

    // Retaining viewport placement during pagination load
    if (loadingOlder.current) {
      const diff = el.scrollHeight - previousHeight.current;
      el.scrollTop += diff;
      loadingOlder.current = false;
      prevMessagesLength.current = messages.length;
      return;
    }

    // Auto-scroll on new incoming messages — only if already at bottom
    if (messages.length > prevMessagesLength.current) {
      if (isAtBottom) {
        requestAnimationFrame(() => {
          el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
        });
      }
    }

    prevMessagesLength.current = messages.length;
  }, [messages, isAtBottom, initialFocusMessageId]);

  const scrollToBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setIsAtBottom(true);
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    setTimeout(() => { if (el) el.scrollTop = el.scrollHeight; }, 50);
  }, []);

  return { containerRef, onScroll, scrollToBottom, isAtBottom };
}
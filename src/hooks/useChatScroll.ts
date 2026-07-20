import { useLayoutEffect, useRef, useState, useCallback } from "react";

export function useChatScroll(
    messages: any[],
    onLoadMore?: () => void
) {
    const containerRef = useRef<HTMLDivElement>(null);
    const initialized = useRef(false);
    const loadingOlder = useRef(false);
    const previousHeight = useRef(0);
    const prevMessagesLength = useRef(messages.length);
    
    // Start at true so the button doesn't awkwardly pop in on first mount
    const [isAtBottom, setIsAtBottom] = useState(true);

    //--------------------------------------------------------
    // SCROLL LISTENER (Precision Subpixel Calculations)
    //--------------------------------------------------------
    const onScroll = useCallback(() => {
        const el = containerRef.current;
        if (!el) return;

        // Determine if user has scrolled away from the bottom edge
        const currentScrollPosition = el.scrollTop + el.clientHeight;
        const totalContentHeight = el.scrollHeight;
        
        // A buffer zone of 30px handles zoom settings and fractional pixels flawlessly
        const bottom = Math.abs(totalContentHeight - currentScrollPosition) < 30;
        setIsAtBottom(bottom);

        // Historical Pagination Trigger
        if (
            el.scrollTop < 100 &&
            onLoadMore &&
            !loadingOlder.current &&
            messages.length > 0
        ) {
            loadingOlder.current = true;
            previousHeight.current = el.scrollHeight;
            onLoadMore();
        }
    }, [onLoadMore, messages.length]);

    //--------------------------------------------------------
    // LAYOUT EFFECT MATCHERS
    //--------------------------------------------------------
    useLayoutEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        // Context 1: Initial component mount setup
        if (!initialized.current && messages.length > 0) {
            initialized.current = true;
            el.scrollTop = el.scrollHeight;
            setIsAtBottom(true);
            prevMessagesLength.current = messages.length;
            return;
        }

        // Context 2: Retaining viewport placement during pagination load
        if (loadingOlder.current) {
            const diff = el.scrollHeight - previousHeight.current;
            el.scrollTop += diff;
            loadingOlder.current = false;
            prevMessagesLength.current = messages.length;
            return;
        }

        // Context 3: Auto-scroll on new downstream incoming messages
        if (messages.length > prevMessagesLength.current) {
            if (isAtBottom) {
                requestAnimationFrame(() => {
                    el.scrollTo({
                        top: el.scrollHeight,
                        behavior: "smooth"
                    });
                });
            }
        }
        
        prevMessagesLength.current = messages.length;
    }, [messages, isAtBottom]);

    //--------------------------------------------------------
    // PUBLIC TRIGGER ACTION
    //--------------------------------------------------------
    const scrollToBottom = useCallback(() => {
        const el = containerRef.current;
        if (!el) return;

        // Update the state immediately to hide button layout on click
        setIsAtBottom(true);

        // Smooth scroll transition
        el.scrollTo({
            top: el.scrollHeight,
            behavior: "smooth"
        });

        // Fail-safe fallback: if smooth scroll is blocked by layout engines, snap directly
        setTimeout(() => {
            if (el) el.scrollTop = el.scrollHeight;
        }, 50);
    }, []);

    return {
        containerRef,
        onScroll,
        scrollToBottom,
        isAtBottom
    };
}
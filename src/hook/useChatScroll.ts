import { useEffect, useRef } from "react"

export function useChatScroll(
  messages: any[],
  onLoadMore?: () => void
) {
  const containerRef =
    useRef<HTMLDivElement | null>(null)

  const shouldAutoScroll =
    useRef(true)

  const previousScrollHeight =
    useRef(0)

  const loadingOlderMessages =
    useRef(false)

  const onScroll = () => {
    const el = containerRef.current
    if (!el) return

    const distanceFromBottom =
      el.scrollHeight -
      el.scrollTop -
      el.clientHeight

    shouldAutoScroll.current =
      distanceFromBottom < 100

    if (
      el.scrollTop < 50 &&
      onLoadMore &&
      !loadingOlderMessages.current
    ) {
      loadingOlderMessages.current = true
      previousScrollHeight.current =
        el.scrollHeight

      onLoadMore()
    }
  }

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    // Initial load
    if (messages.length > 0 && el.scrollTop === 0) {
      el.scrollTop = el.scrollHeight
      loadingOlderMessages.current = false
      return
    }

    // After loading older messages
    if (loadingOlderMessages.current) {
      const heightDifference =
        el.scrollHeight -
        previousScrollHeight.current

      el.scrollTop =
        el.scrollTop + heightDifference

      loadingOlderMessages.current = false
      return
    }

    // New message at bottom
    if (shouldAutoScroll.current) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages])

  return {
    containerRef,
    onScroll
  }
}
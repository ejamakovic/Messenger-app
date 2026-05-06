import { useEffect, useRef } from "react"

export function useChatScroll(messages: any[], onLoadMore?: () => void) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const shouldAutoScroll = useRef(true)
  const anchorRef = useRef<HTMLElement | null>(null)

  const onScroll = () => {
    const el = containerRef.current
    if (!el) return

    if (el.scrollTop < 50) {
      anchorRef.current = el.children[0] as HTMLElement
      onLoadMore?.()
    }

    shouldAutoScroll.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 100
  }

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    if (shouldAutoScroll.current) {
      el.scrollTop = el.scrollHeight
      return
    }

    if (anchorRef.current) {
      el.scrollTop = anchorRef.current.offsetTop
      anchorRef.current = null
    }
  }, [messages])

  return { containerRef, onScroll }
}
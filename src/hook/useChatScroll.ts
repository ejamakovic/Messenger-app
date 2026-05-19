import { useLayoutEffect, useRef } from "react"

export function useChatScroll(messages: any[], onLoadMore?: () => void) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  const shouldAutoScroll = useRef(true)
  const isLoadingOlder = useRef(false)
  const initialized = useRef(false)

  const anchorId = useRef<string | null>(null)

  const onScroll = () => {
    const el = containerRef.current
    if (!el) return

    const distanceFromBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight

    shouldAutoScroll.current = distanceFromBottom < 120

    if (el.scrollTop < 60 && onLoadMore && !isLoadingOlder.current) {
      isLoadingOlder.current = true

      const firstVisible = Array.from(el.children).find((child: any) => {
        const rect = child.getBoundingClientRect()
        return rect.bottom > 0
      }) as HTMLElement | undefined

      anchorId.current = firstVisible?.dataset?.id ?? null

      onLoadMore()
    }
  }

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return

    // INITIAL SCROLL
    if (!initialized.current && messages.length > 0) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.scrollTop = el.scrollHeight
          initialized.current = true
        })
      })
      return
    }
  
    const runAfterImagesLoad = () => {
      const imgs = Array.from(el.querySelectorAll("img"))

      const pending = imgs.filter((img) => !img.complete)

      if (pending.length === 0) {
        restoreScroll()
      } else {
        Promise.all(
          pending.map(
            (img) =>
              new Promise((res) => {
                img.onload = img.onerror = () => res(true)
              })
          )
        ).then(restoreScroll)
      }
    }

    const restoreScroll = () => {
      if (!isLoadingOlder.current) return

      const anchorEl = el.querySelector(
        `[data-id="${anchorId.current}"]`
      ) as HTMLElement | null

      if (anchorEl) {
        const top = anchorEl.getBoundingClientRect().top
        el.scrollTop += top
      }

      isLoadingOlder.current = false
      anchorId.current = null
    }

    if (isLoadingOlder.current) {
      requestAnimationFrame(() => {
        requestAnimationFrame(runAfterImagesLoad)
      })
      return
    }

    if (shouldAutoScroll.current) {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight
      })
    }

  }, [messages])

  return { containerRef, onScroll }
}
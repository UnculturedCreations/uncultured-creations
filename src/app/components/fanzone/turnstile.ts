import { useCallback, useEffect, useRef } from "react"

// Loads Cloudflare Turnstile once and exposes a typed handle.

export interface TurnstileOptions {
  sitekey: string
  execution?: "render" | "execute"
  appearance?: "always" | "execute" | "interaction-only"
  callback?: (token: string) => void
  "error-callback"?: () => void
  "expired-callback"?: () => void
}

export interface TurnstileApi {
  render: (el: HTMLElement, options: TurnstileOptions) => string
  execute: (widgetId: string) => void
  reset: (widgetId: string) => void
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

let loading: Promise<TurnstileApi> | null = null

export function loadTurnstile(): Promise<TurnstileApi> {
  if (typeof window === "undefined") return Promise.reject(new Error("Turnstile needs a browser"))
  if (window.turnstile) return Promise.resolve(window.turnstile)
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const script = document.createElement("script")
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
      script.async = true
      script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile unavailable")))
      script.onerror = () => {
        loading = null
        reject(new Error("Turnstile failed to load"))
      }
      document.head.appendChild(script)
    })
  }
  return loading
}

// React hook: prepares an invisible Turnstile check and returns a function that
// runs it and resolves with a token (or rejects). Shows a challenge only when needed.

export function useTurnstile(siteKey: string | undefined, enabled = true) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widget = useRef<{ api: TurnstileApi; id: string } | null>(null)
  const pending = useRef<{ resolve: (t: string) => void; reject: () => void } | null>(null)

  useEffect(() => {
    if (!enabled || !siteKey || !containerRef.current) return
    let cancelled = false
    loadTurnstile()
      .then((api) => {
        if (cancelled || !containerRef.current || widget.current) return
        const id = api.render(containerRef.current, {
          sitekey: siteKey,
          execution: "execute",
          appearance: "interaction-only",
          callback: (token) => pending.current?.resolve(token),
          "error-callback": () => pending.current?.reject(),
          "expired-callback": () => pending.current?.reject(),
        })
        widget.current = { api, id }
      })
      .catch(() => {})
    return () => {
      cancelled = true
      if (widget.current) widget.current.api.remove(widget.current.id)
      widget.current = null
    }
  }, [siteKey, enabled])

  const getToken = useCallback(
    () =>
      new Promise<string>((resolve, reject) => {
        if (!widget.current) return reject()
        const timer = setTimeout(reject, 30000)
        pending.current = {
          resolve: (t) => (clearTimeout(timer), resolve(t)),
          reject: () => (clearTimeout(timer), reject()),
        }
        widget.current.api.execute(widget.current.id)
      }),
    [],
  )

  const reset = useCallback(() => {
    if (widget.current) widget.current.api.reset(widget.current.id)
  }, [])

  return { containerRef, getToken, reset }
}

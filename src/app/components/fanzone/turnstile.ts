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

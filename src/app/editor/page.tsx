import type { Metadata } from "next"
import EditorApp from "./EditorApp"

// Private editor area: kept out of search engines and the sitemap.
export const metadata: Metadata = {
  title: "Editor | Reality Reloaded",
  robots: { index: false, follow: false },
}

export default function EditorPage() {
  return (
    <main className="min-h-screen bg-base px-4 py-10 text-contrast sm:px-6">
      <div className="mx-auto max-w-5xl">
        <EditorApp />
      </div>
    </main>
  )
}

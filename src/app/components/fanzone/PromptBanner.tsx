import Link from "next/link"
import { PenLine } from "lucide-react"
import type { WritingPrompt } from "@/lib/realityReloaded"
import { focusRing } from "./ui"

// The current writing prompt(s), each with a link to write for it.
export default function PromptBanner({ prompts }: { prompts: WritingPrompt[] }) {
  if (prompts.length === 0) return null
  return (
    <div className="space-y-3">
      {prompts.map((p) => (
        <section key={p.id} aria-label={`Writing prompt: ${p.title}`} className="relative overflow-hidden rounded-2xl border border-accent/30 bg-accent/10 p-5">
          <p className="inline-flex items-center gap-2 text-xs font-medium text-contrast/80">
            <PenLine className="h-4 w-4" aria-hidden="true" />
            Writing prompt{p.show ? ` · ${p.show.short_name ?? p.show.name}` : ""}
          </p>
          <h3 className="mt-2 font-heading text-lg font-bold text-contrast">{p.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-contrast/85">{p.prompt}</p>
          <Link
            href={`/fanzone/fiction/submit?prompt=${p.id}${p.show ? `&show=${p.show.slug}` : ""}`}
            className={`mt-4 inline-flex rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white ${focusRing}`}
          >
            Write for this prompt
          </Link>
        </section>
      ))}
    </div>
  )
}

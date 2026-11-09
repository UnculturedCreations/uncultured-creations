import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import NotificationsList from "./NotificationsList"
import { focusRing } from "@/app/components/fanzone/ui"

export const metadata: Metadata = { title: "Notifications | Uncultured Creations", robots: { index: false, follow: false } }

export default function NotificationsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 md:py-16">
      <Link href="/account" className={`inline-flex items-center gap-1.5 rounded-sm text-sm text-contrast/70 hover:text-contrast ${focusRing}`}>
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Your account
      </Link>
      <h1 className="mb-6 mt-4 w-fit bg-gradient-to-r from-accent to-secondary bg-clip-text pb-2 font-heading text-4xl font-bold text-transparent">Notifications</h1>
      <NotificationsList />
    </main>
  )
}

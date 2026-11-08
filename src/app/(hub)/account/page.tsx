import type { Metadata } from "next"
import AccountApp from "./AccountApp"

export const metadata: Metadata = {
  title: "Your account | Uncultured Creations",
  robots: { index: false, follow: false },
}

export default function AccountPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 md:py-16">
      <h1 className="w-fit bg-gradient-to-r from-accent to-secondary bg-clip-text pb-2 font-heading text-4xl font-bold text-transparent">Your fan account</h1>
      <div className="mt-8">
        <AccountApp />
      </div>
    </main>
  )
}

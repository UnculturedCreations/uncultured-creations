import Header from "@/app/components/common/Header"
import Footer from "@/app/components/common/Footer"

// Shared shell for the hub and its creative sections.
// /portfolio intentionally sits outside this route group and keeps its own header and footer.
export default function HubLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex min-h-screen flex-col bg-base text-contrast">
      <a
        href="#content"
        className="sr-only z-[60] rounded-md bg-accent px-4 py-2 font-medium text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <Header />
      <div id="content" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </div>
      <Footer />
    </div>
  )
}

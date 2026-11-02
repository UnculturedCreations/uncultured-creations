// Previous portfolio page, preserved but not served while /portfolio shows a coming-soon page.
// To restore: replace the contents of page.tsx with `export { default } from "./PortfolioHome"` (and add back its metadata if needed).
// Note: this folder now sits inside the (hub) layout. If restored as-is, the hub header and this page's own
// Header would both show; at that point, either drop the inner Header/Footer or move portfolio/ back out of (hub).
import Hero from "./components/Hero";
import Services from "./components/Services";
import Portfolio from "./components/Portfolio";
import About from "./components/About";
import ContactForm from "./components/ContactForm";
import Header from "./components/Header";
import Footer from "./components/Footer";

export default function PortfolioHome() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Services />
        <Portfolio />
        <About />
        <ContactForm />
      </main>
      <Footer />
    </>
  );
}

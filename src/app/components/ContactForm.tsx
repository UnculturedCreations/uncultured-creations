// components/ContactForm.tsx
export default function ContactForm() {
    return (
      <section id="contact" className="font-sans pt-20 pb-40 bg-base">
        <div className="container mx-auto px-4 max-w-xl">
          <h2 className="font-heading text-center text-4xl font-bold text-contrast border-b-2 border-accent pb-1 mb-8">Get In Touch</h2>
          <form
            action="https://formspree.io/f/xzzrdwlj?redirect=https://uncultured-creations.vercel.app/thank-you"
            method="POST"
            className="space-y-4"
          >
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              required
              className="w-full border border-gray-300 p-3 rounded-xl bg-contrast"
            />
            <input
              type="email"
              name="email"
              placeholder="Your Email"
              required
              className="w-full border border-gray-300 p-3 rounded-xl bg-contrast"
            />
            <textarea
              name="message"
              placeholder="Your Message"
              required
              rows={5}
              className="w-full border border-gray-300 p-3 rounded-xl bg-contrast"
            />
            <button
              type="submit"
              className="w-full bg-accent hover:bg-blue-700 text-contrast font-semibold py-3 rounded-xl transition"
            >
              Send Message
            </button>
          </form>
        </div>
      </section>
    );
  }
  
// components/ContactForm.tsx
export default function ContactForm() {
    return (
      <section id="contact" className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-xl">
          <h2 className="text-3xl font-bold text-center mb-8">Get In Touch</h2>
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
              className="w-full border border-gray-300 p-3 rounded-xl"
            />
            <input
              type="email"
              name="email"
              placeholder="Your Email"
              required
              className="w-full border border-gray-300 p-3 rounded-xl"
            />
            <textarea
              name="message"
              placeholder="Your Message"
              required
              rows={5}
              className="w-full border border-gray-300 p-3 rounded-xl"
            />
            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition"
            >
              Send Message
            </button>
          </form>
        </div>
      </section>
    );
  }
  
'use client';

export default function About() {
  return (
    <section id="about" className="font-sans py-20 bg-base">
      <div className="container mx-auto px-4 max-w-4xl text-center">
        <h2 className="font-heading text-center text-4xl font-bold text-contrast border-b-2 border-accent pb-1 mb-4">About Us</h2>
        <p className="text-lg text-contrast mb-8">
          At Uncultured Creations, we blend creativity with cutting-edge technology to build digital experiences that stand out.
        </p>

        <p className="text-contrast mb-4">
          We&apos;re a creative studio specializing in web design, development, branding, and digital strategy. Whether you&apos;re a startup, an artist, or an established business, we help bring your ideas to life through intuitive design and smart technology.
        </p>

        <p className="text-contrast mb-6">
          Our mission is simple: build bold, user-focused digital products that look great and perform even better. No fluff. Just clean, intentional work that works.
        </p>

        <a
          href="#contact"
          className="inline-block mt-4 px-6 py-3 bg-accent text-contrast font-medium rounded-xl hover:bg-blue-700 transition"
        >
          Let&apos;s Work Together
        </a>
      </div>
    </section>
  );
}

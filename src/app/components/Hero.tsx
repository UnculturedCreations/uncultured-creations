// components/Hero.tsx
export default function Hero() {
    return (
      <section className="w-full h-screen flex flex-col justify-center items-center text-center px-4 bg-black text-white">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          Welcome to <span className="text-purple-500">Uncultured Creations</span>
        </h1>
        <p className="text-lg md:text-2xl max-w-2xl mb-6">
          Bold Websites. Beautiful Designs. Powerful Apps.
        </p>
        <a
          href="#portfolio"
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-2xl text-lg transition"
        >
          See Our Work
        </a>
      </section>
    );
  }
  
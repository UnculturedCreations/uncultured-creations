export default function Hero() {
  return (
    <section className="relative w-full h-screen bg-base overflow-hidden text-contrast flex flex-col items-center justify-center text-center px-4">
      
      {/* Background Fog Image */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30 pointer-events-none z-0 animate-pulse"
        style={{ backgroundImage: "url('/images/electric-fog.png')" }}
      />

      


      {/* Content */}
      <div className="relative z-10 font-sans">
        <h1 className="text-4xl md:text-5xl font-bold text-contrast text-center max-w-xl mx-auto mb-0">
          UNCULTURED
        </h1>
        <p className="text-xl md:text-2.5xl text-center text-contrast max-w-xl mx-auto mb-12">
          C  R  E  A  T  I  O  N  S
        </p>
        <p className="text-6xl md:text-8xl text-center text-accent max-w-xl mx-auto mb-0">
          BRANDING
        </p>
        <p className="text-6xl md:text-8xl text-center text-accent max-w-4xl mx-auto mb-8">
          FOR THE BRAVE
        </p>
        <a
          href="#portfolio"
          className="bg-transparent hover:shadow-[0_0_10px_1.5px_#0066FF] border border-contrast text-contrast px-6 py-3 rounded-full text-base md:text-lg transition"
        >
          See Our Work
        </a>
      </div>        
    </section>
  );
}

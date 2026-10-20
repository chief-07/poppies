export default function Home() {
  return (
    <main className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#132216]">
      {/* Poppy Field Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-100"
        style={{
          backgroundImage: "url('/poppies-bg.jpg')",
        }}
      />

      {/* Subtle atmospheric vignette overlay */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[0.5px]" />

      {/* Centered Typography: Frank Ruhl Libre, Italics, POPPIES */}
      <div className="relative z-10 text-center px-6 select-none animate-fade-in">
        <h1 className="font-serif italic font-normal text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-[#FBF9F5] tracking-[0.08em] drop-shadow-[0_4px_24px_rgba(0,0,0,0.45)]">
          POPPIES
        </h1>
      </div>
    </main>
  );
}

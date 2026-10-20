export default function Home() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#132216]">
      {/* Poppy Field Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/poppies-bg.jpg')",
        }}
      />

      {/* Subtle atmospheric vignette */}
      <div className="absolute inset-0 bg-black/15 pointer-events-none" />

      {/* 
        Positioned down a click (~51%) and right two clicks (~47.5%), 
        tinted in #F7FFD9 with tight, natural serif kerning.
      */}
      <div className="absolute top-[51%] left-[47.5%] -translate-y-1/2 z-10 select-none">
        <h1 className="font-serif italic font-normal text-2xl sm:text-3xl md:text-4xl lg:text-[2.65rem] text-[#F7FFD9] tracking-[0.04em] drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]">
          POPPIES
        </h1>
      </div>
    </main>
  );
}

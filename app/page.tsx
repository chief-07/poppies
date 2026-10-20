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
        Text placed in the central clearing, directly to the right of the lone central poppy:
        The central flower is at ~42% left, 49% top.
        The text begins at ~45%-46% left, perfectly nestled in the dark green clearing.
      */}
      <div className="absolute top-[49%] left-[45%] -translate-y-1/2 z-10 select-none">
        <h1 className="font-serif italic font-normal text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] text-[#FBF9F5] tracking-[0.14em] drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
          POPPIES
        </h1>
      </div>
    </main>
  );
}

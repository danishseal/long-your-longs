export default function Home() {
  return (
    <>
      <section style={{ zIndex: 9999, position: "relative" }}>
        <section className="hero clean_bg content-section min-h-screen flex items-center justify-center bg-[#f5f2ed]">
          <div className="container mx-auto px-4">
            <div className="row">
              <div className="col-12 text-center">
                <h1 className="relative left-[0.03em] text-8xl md:text-9xl lg:text-[10rem] font-medium text-[#065f46] tracking-[-0.06em] leading-none mb-8 font-[family-name:var(--font-montagu-slab)]">
                  Long your Longs
                </h1>
                <p className="text-base md:text-lg uppercase tracking-[0.2em] text-[#065f46] font-[family-name:jgs]">
                  We let you be perpetually 
                  <br />
                  optimistic on memes.
                </p>
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    className="bg-[#065f46] px-8 py-3 text-sm uppercase tracking-[0.2em] text-[#f5f2ed] transition-opacity hover:opacity-90 font-[family-name:jgs]"
                  >
                    Launch
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </section>
    </>
  );
}

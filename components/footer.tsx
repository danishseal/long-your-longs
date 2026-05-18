export default function Footer() {
  return (
    <>
      <section className="big_title subscribe content-section bg-[#f5f2ed] py-8 md:py-12">
        <div className="w-full mx-auto px-4 max-w-7xl">
          <div className="big_title__item bg-[#ebe8e3] py-32 md:py-48 lg:py-64 px-8 flex flex-col items-center justify-center text-center">
            <p className="big_title__item_text text-3xl md:text-4xl lg:text-5xl text-black font-[family-name:var(--font-playfair)] leading-relaxed mb-4">
              Didn&apos;t find the right name?
            </p>
            <p className="big_title__subtitle text-xs uppercase tracking-wider text-black/60 font-[family-name:var(--font-geist-mono)] mb-8">
              Subscribe to get new names first
            </p>
            <form
              id="subscribeForm"
              action="#"
              method="post"
              className="flex gap-2 max-w-md w-full"
            >
              <input
                type="email"
                name="email"
                placeholder="YOUR EMAIL"
                autoComplete="off"
                required
                className="flex-1 bg-[#d4d4d4] px-4 py-2 text-xs uppercase tracking-wider placeholder-black/40 font-[family-name:var(--font-geist-mono)] outline-none border-none"
              />
              <button
                type="submit"
                className="bg-black text-white px-4 py-2 text-xs uppercase tracking-wider font-[family-name:var(--font-geist-mono)] hover:bg-black/80 transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>

      <footer className="footer content-section bg-[#f5f2ed] py-16 md:py-24">
        <div className="w-full mx-auto px-4 max-w-7xl">
          <div className="footer__item flex flex-col items-center text-center">
            <p className="footer__title text-6xl md:text-7xl lg:text-8xl text-black mb-4 font-[family-name:var(--font-playfair)]">
              Long your Longs
            </p>
            <p className="text-xs uppercase tracking-wider text-black font-[family-name:var(--font-geist-mono)]">
              We let you be perpetually 
            </p>
            <p className="text-xs uppercase tracking-wider text-black mb-12 font-[family-name:var(--font-geist-mono)]">
              optimistic on memes.
            </p>
            <div className="flex flex-col items-center gap-2 mb-8">
              <a
                href="https://coda.io/d/_dqu9AptdRB6/Terms-Conditions_suN26eAf"
                className="text-xs uppercase tracking-wider text-black font-[family-name:var(--font-geist-mono)] hover:underline"
              >
                terms and conditions
              </a>
              <a
                href="https://coda.io/d/_dqu9AptdRB6/Privacy-Policy_suXZyt8a"
                className="text-xs uppercase tracking-wider text-black font-[family-name:var(--font-geist-mono)] hover:underline"
              >
                privacy policy
              </a>
            </div>
            <a
              href="mailto:contact@of.domains"
              className="text-xs uppercase tracking-wider text-black mb-8 font-[family-name:var(--font-geist-mono)] hover:underline"
            >
              contact@of.domains
            </a>
            <p className="text-xs uppercase tracking-wider text-black font-[family-name:var(--font-geist-mono)]">
              2025, Open field domains, inc
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}

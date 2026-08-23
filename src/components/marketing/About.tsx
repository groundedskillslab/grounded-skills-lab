export function About() {
  return (
    <section id="about" className="pt-14 pb-12 md:pt-[88px] md:pb-[72px] px-6 sm:px-10 text-center">
      <div className="max-w-[680px] mx-auto">
        {/* Bookmania Semibold Italic pull-quote — one of the three approved accent spots for the serif */}
        <p className="font-body italic text-lg md:text-[22px] leading-[1.6] text-[#2a2a2a]">
          &ldquo;Grounded Skills Lab started with a simple question: how can we become more intentional about the way
          we develop skills?&rdquo;
        </p>
        <a
          href="#"
          className="inline-block mt-5 font-heading font-semibold text-[13px] tracking-[0.04em] text-brand-ink border-b border-brand-ink pb-0.5"
        >
          Read more about Grounded →
        </a>
      </div>
    </section>
  );
}

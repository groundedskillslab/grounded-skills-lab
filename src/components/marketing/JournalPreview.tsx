export function JournalPreview() {
  return (
    <section id="journal" className="pt-14 pb-14 md:pt-24 md:pb-24 px-6 sm:px-10 bg-ink text-white">
      <div className="max-w-[1160px] mx-auto grid md:grid-cols-[0.85fr_1.15fr] gap-10 md:gap-[70px] items-center">
        <div className="flex justify-center order-2 md:order-1">
          <div className="w-[240px] md:w-[280px] h-[310px] md:h-[360px] bg-[#141412] border border-[#2c2c26] rounded-lg px-6 py-7 md:px-[26px] md:py-[34px] flex flex-col justify-between shadow-[0_40px_80px_-30px_rgba(0,0,0,0.6)]">
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-mark.svg" alt="" className="w-6 h-auto" aria-hidden />
              {/* Bookmania Semibold Italic — one of the three approved accent spots for the serif */}
              <div className="font-body italic font-semibold text-2xl md:text-[26px] text-brand-soft mt-6 leading-[1.2]">
                Practice
                <br />
                Journal
              </div>
            </div>
            <div>
              <div className="h-px bg-[#2c2c26] mb-3.5" />
              <div className="inline-block font-heading text-[9.5px] tracking-[0.08em] uppercase text-[#9db894] bg-[#7A8F72]/[0.14] px-2 py-1 rounded">
                Focus · Work · Notice · Refine · Repeat
              </div>
            </div>
          </div>
        </div>

        <div className="order-1 md:order-2">
          <div className="font-heading font-semibold text-xs tracking-[0.16em] uppercase text-brand">Grounded Practice Journal</div>
          <div className="inline-block mt-3 font-heading font-semibold text-[11px] tracking-[0.1em] uppercase text-brand border border-brand/40 px-[11px] py-[5px] rounded">
            In Development
          </div>
          <h2 className="font-heading font-bold text-2xl md:text-[30px] mt-4.5 leading-[1.3]">A companion for reflection.</h2>
          <p className="text-[15.5px] leading-[1.5] text-[#c9c7c2] mt-3.5 max-w-[520px]">
            The Journal and the app are built to complement each other, not duplicate each other. The Journal is
            where you think and reflect; the app is where measurement, memory, and analysis live. Write in one, log
            in the other — a shared session ID keeps them connected.
          </p>
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";

export function BetaCta() {
  return (
    <section className="pt-6 pb-16 md:pb-[104px] px-6 sm:px-10">
      <div className="max-w-[1160px] mx-auto bg-brand-soft rounded-[10px] px-8 py-12 sm:px-20 sm:py-16 text-center">
        <div className="font-heading font-semibold text-xs tracking-[0.16em] uppercase text-brand-ink">Current priority</div>
        <h2 className="font-heading font-bold text-2xl md:text-[32px] mt-4">Help shape Grounded Skills Lab.</h2>
        <p className="text-base leading-[1.5] text-[#5c4a24] mt-3 max-w-[560px] mx-auto">
          Grounded is currently being tested with people actively working to improve real skills — as an athlete, a
          student, a coach, or a practitioner.
        </p>
        <Link
          href="/beta"
          className="inline-flex items-center justify-center gap-2 font-heading font-semibold text-[15px] bg-ink text-white rounded px-8 py-4 mt-6.5 hover:bg-black transition"
        >
          Request Beta Access
        </Link>
      </div>
    </section>
  );
}

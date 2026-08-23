import { CoachIcon } from "./icons";

export function SupportedPractice() {
  return (
    <section id="supported-practice" className="pt-14 pb-10 md:pt-[88px] md:pb-16 px-6 sm:px-10">
      <div className="max-w-[1000px] mx-auto flex flex-col sm:flex-row items-center sm:items-center gap-6 sm:gap-14 text-center sm:text-left">
        <div className="shrink-0">
          <div className="h-16 w-16 rounded-full bg-white border border-gridline flex items-center justify-center">
            <CoachIcon size={28} />
          </div>
        </div>
        <div>
          <div className="font-heading font-semibold text-xs tracking-[0.16em] uppercase text-brand-ink">Supported practice</div>
          <h2 className="font-heading font-bold text-2xl md:text-[26px] mt-2.5">Practice independently or with support.</h2>
          <p className="text-[15.5px] leading-[1.5] text-[#4a4a4a] mt-2 max-w-[640px]">
            Coaches, practitioners, and other professionals can guide someone else&rsquo;s skill development in
            Grounded too — building programs, reviewing data, and tracking progress alongside the person doing the
            work.
          </p>
        </div>
      </div>
    </section>
  );
}

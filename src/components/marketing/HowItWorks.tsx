import { PracticeIcon, MeasureIcon, ImproveIcon, RepeatIcon } from "./icons";

const STEPS = [
  { Icon: PracticeIcon, title: "Practice", body: "Work deliberately on a clearly defined skill." },
  { Icon: MeasureIcon, title: "Measure", body: "Capture what actually happened." },
  { Icon: ImproveIcon, title: "Improve", body: "Use your results to understand progress and adjust." },
  { Icon: RepeatIcon, title: "Repeat", body: "Carry what you learned into the next session." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-10 md:py-24 px-6 sm:px-10 bg-white border-y border-gridline">
      <div className="max-w-[1160px] mx-auto">
        <div className="text-center mb-10 md:mb-16">
          <div className="font-heading font-semibold text-xs tracking-[0.16em] uppercase text-brand-ink">How it works</div>
          <h2 className="font-heading font-bold text-[26px] md:text-[34px] mt-4">The loop, every time</h2>
        </div>

        {/* Desktop: 4-up with a connecting line. Mobile: stacked step list. */}
        <div className="hidden md:grid grid-cols-4 relative">
          <div className="absolute top-[26px] left-[12.5%] right-[12.5%] h-px bg-gridline" />
          {STEPS.map(({ Icon, title, body }) => (
            <div key={title} className="text-center px-5 relative z-10">
              <div className="h-[52px] w-[52px] rounded-full bg-plane border border-gridline flex items-center justify-center mx-auto mb-5">
                <Icon />
              </div>
              <h3 className="font-heading font-semibold text-[17px] mb-2">{title}</h3>
              <p className="text-sm leading-[1.5] text-[#5a5a5a]">{body}</p>
            </div>
          ))}
        </div>

        <div className="md:hidden flex flex-col">
          {STEPS.map(({ Icon, title, body }, i) => (
            <div key={title} className={`flex gap-4 items-start py-4.5 ${i !== STEPS.length - 1 ? "border-b border-gridline" : ""}`}>
              <div className="h-11 w-11 shrink-0 rounded-full bg-plane border border-gridline flex items-center justify-center">
                <Icon size={20} />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-base mb-1">{title}</h3>
                <p className="text-sm leading-[1.55] text-[#5a5a5a]">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

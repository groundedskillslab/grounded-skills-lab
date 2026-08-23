import { AppFrame, AppSub, AppCard, AppAvatar, AppName, AppMeta, AppBtn } from "./AppMockup";

const ROSTER = [
  { initials: "JL", name: "Jordan Lee", meta: "12 sessions · 2d" },
  { initials: "MR", name: "Morgan Reyes", meta: "Self-directed" },
  { initials: "AC", name: "Alex Chen", meta: "Coach" },
];

export function ProductPreview() {
  return (
    <section id="product" className="py-14 md:py-24 px-6 sm:px-10">
      <div className="max-w-[1160px] mx-auto">
        <div className="mb-10 md:mb-14 max-w-[600px]">
          <div className="font-heading font-semibold text-xs tracking-[0.16em] uppercase text-brand-ink">The product</div>
          <h2 className="font-heading font-bold text-[26px] md:text-[34px] mt-4">See the loop in the product</h2>
          <p className="text-base leading-[1.5] text-[#4a4a4a] mt-3">
            A real, working application — not a concept. Here&rsquo;s what the loop looks like once it&rsquo;s on screen.
          </p>
        </div>

        <div className="flex flex-col md:grid md:grid-cols-[1.15fr_1fr_1fr] gap-7">
          <div>
            <AppFrame>
              <div className="p-5">
                <AppSub className="mb-3.5">Athletes</AppSub>
                <div className="flex flex-col gap-2.5">
                  {ROSTER.map((r) => (
                    <AppCard key={r.name} className="flex items-center gap-2.5 p-2.5">
                      <AppAvatar className="h-7 w-7 text-[10px]">{r.initials}</AppAvatar>
                      <div className="flex-1">
                        <AppName className="text-xs">{r.name}</AppName>
                        <AppMeta className="text-[10px]">{r.meta}</AppMeta>
                      </div>
                    </AppCard>
                  ))}
                </div>
              </div>
            </AppFrame>
            <p className="font-heading text-[13px] text-ink-muted text-center mt-3">Home</p>
          </div>

          <div>
            <AppFrame>
              <div className="p-5">
                <AppSub className="mb-3.5">Independence over time</AppSub>
                <svg viewBox="0 0 200 90" width="100%" height="90" aria-hidden>
                  <polyline
                    points="4,72 40,60 76,64 112,38 148,30 196,10"
                    fill="none"
                    stroke="var(--brand)"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="196" cy="10" r="3.5" fill="var(--brand)" />
                </svg>
                <div className="mt-4">
                  <AppMeta className="mb-1.5">Plan Fidelity</AppMeta>
                  <div className="h-1.5 rounded-full overflow-hidden bg-white/10">
                    <div className="h-full w-[78%] bg-brand" />
                  </div>
                </div>
              </div>
            </AppFrame>
            <p className="font-heading text-[13px] text-ink-muted text-center mt-3">Progress, at a glance</p>
          </div>

          <div className="hidden md:block">
            <AppFrame>
              <div className="p-5">
                <AppSub className="mb-3">Log Practice</AppSub>
                <AppName className="text-[13px] mb-3.5">Technique Drill — Practice</AppName>
                <div className="flex gap-2 mb-3">
                  <AppBtn outline className="flex-1">
                    ✕ Missed
                  </AppBtn>
                  <AppBtn className="flex-1">✓ Completed</AppBtn>
                </div>
                <AppMeta className="mb-1.5">Confidence</AppMeta>
                <div className="flex gap-1.5 mb-3.5">
                  <div className="h-5 w-5 rounded bg-brand" />
                  <div className="h-5 w-5 rounded bg-brand" />
                  <div className="h-5 w-5 rounded bg-brand" />
                  <div className="h-5 w-5 rounded bg-white/10 border border-white/10" />
                  <div className="h-5 w-5 rounded bg-white/10 border border-white/10" />
                </div>
                <AppBtn outline>Save entry</AppBtn>
              </div>
            </AppFrame>
            <p className="font-heading text-[13px] text-ink-muted text-center mt-3">Log a session in seconds</p>
          </div>
        </div>
      </div>
    </section>
  );
}

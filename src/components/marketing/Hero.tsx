import Link from "next/link";
import { AppFrame, AppSub, AppCard, AppAvatar, AppName, AppMeta, AppTag, AppBtn } from "./AppMockup";

export function Hero() {
  return (
    <section className="pt-14 md:pt-[88px] pb-10 md:pb-[88px] px-6 sm:px-10">
      <div className="max-w-[1160px] mx-auto grid md:grid-cols-2 gap-10 md:gap-16 items-center">
        <div>
          <div className="font-heading font-semibold text-[11px] md:text-xs tracking-[0.16em] uppercase text-brand-ink">
            Grounded Skills Lab
          </div>
          <h1 className="font-heading font-extrabold text-[38px] md:text-[54px] leading-[1.05] md:leading-[1.04] tracking-[-0.02em] mt-3.5 md:mt-4.5">
            Practice.
            <br />
            Measure.
            <br />
            Improve.
            <br />
            <span className="text-brand">Repeat.</span>
          </h1>
          <p className="text-base md:text-[17px] leading-[1.5] text-[#3d3d3d] max-w-[440px] mt-4.5 md:mt-5.5">
            A structured way to practice skills intentionally, measure meaningful progress, and learn what to work on
            next.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 md:mt-8">
            <Link
              href="/beta"
              className="inline-flex items-center justify-center gap-2 font-heading font-semibold text-[15px] bg-ink text-white rounded px-7 py-4 hover:bg-black transition"
            >
              Join the Beta
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 font-heading font-semibold text-[15px] border border-ink text-ink rounded px-7 py-[15px] hover:bg-ink hover:text-white transition"
            >
              Sign In
            </Link>
          </div>
        </div>

        <AppFrame>
          <div className="px-6 py-6.5">
            <div className="flex items-center gap-2.5 mb-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-mark.svg" alt="" className="w-5 h-auto" aria-hidden />
              <AppSub>Grounded Skills Lab · Performance</AppSub>
            </div>
            <div className="font-heading font-extrabold text-2xl md:text-[30px] tracking-[-0.01em] text-white leading-[1.2] mb-4.5">
              Practice. Measure.
              <br />
              Improve. Repeat.
            </div>
            <AppBtn className="mb-5 inline-block">Start Session</AppBtn>
            <AppCard className="flex items-center gap-3">
              <AppAvatar>JL</AppAvatar>
              <div className="flex-1">
                <AppName>Jordan Lee</AppName>
                <AppMeta>12 sessions logged · last practice 2d ago</AppMeta>
              </div>
              <AppTag>Progressing</AppTag>
            </AppCard>
          </div>
        </AppFrame>
      </div>
    </section>
  );
}

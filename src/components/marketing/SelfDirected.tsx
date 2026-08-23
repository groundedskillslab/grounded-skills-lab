import { AppFrame, AppSub, AppCard, AppAvatar, AppName, AppMeta, AppBtn } from "./AppMockup";

export function SelfDirected() {
  return (
    <section id="self-directed" className="pt-10 pb-14 md:pt-10 md:pb-24 px-6 sm:px-10 bg-white border-t border-b border-gridline">
      <div className="max-w-[1160px] mx-auto grid md:grid-cols-2 gap-10 md:gap-[70px] items-center">
        <div>
          <div className="font-heading font-semibold text-xs tracking-[0.16em] uppercase text-brand-ink">Self-directed practice</div>
          <h2 className="font-heading font-bold text-[26px] md:text-[32px] mt-4 leading-[1.3]">
            Your practice.
            <br />
            Your data. Your progress.
          </h2>
          <p className="text-base leading-[1.5] text-[#4a4a4a] mt-4 max-w-[440px]">
            Athletes, students, musicians, or anyone deliberately developing a skill can use Grounded entirely on
            their own — choose what you&rsquo;re working on, define what success looks like, practice, record
            results, and see what&rsquo;s actually changing.
          </p>
        </div>

        <AppFrame>
          <div className="p-6">
            <AppSub className="mb-1.5">Your Training</AppSub>
            <div className="flex items-center gap-2.5 my-3.5">
              <AppAvatar>JL</AppAvatar>
              <div>
                <AppName>Jordan Lee</AppName>
                <AppMeta>Self-directed</AppMeta>
              </div>
            </div>
            <AppCard className="mb-3">
              <AppMeta className="mb-2">Your Practice</AppMeta>
              <AppName className="text-xs">Footwork Sequence — Practice</AppName>
            </AppCard>
            <AppBtn outline className="text-center">
              Log Practice
            </AppBtn>
          </div>
        </AppFrame>
      </div>
    </section>
  );
}

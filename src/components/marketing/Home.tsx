import { MarketingNav } from "./Nav";
import { Hero } from "./Hero";
import { Problem } from "./Problem";
import { HowItWorks } from "./HowItWorks";
import { ProductPreview } from "./ProductPreview";
import { SelfDirected } from "./SelfDirected";
import { SupportedPractice } from "./SupportedPractice";
import { JournalPreview } from "./JournalPreview";
import { About } from "./About";
import { BetaCta } from "./BetaCta";
import { MarketingFooter } from "./Footer";

export function MarketingHome() {
  return (
    <div className="pb-[76px] md:pb-0">
      <MarketingNav />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <ProductPreview />
        <SelfDirected />
        <SupportedPractice />
        <JournalPreview />
        <About />
        <BetaCta />
      </main>
      <MarketingFooter />
    </div>
  );
}

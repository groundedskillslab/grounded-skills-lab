import Link from "next/link";
import { BetaFormClient } from "@/components/marketing/BetaFormClient";
import { MarketingFooter } from "@/components/marketing/Footer";

export default function BetaPage() {
  return (
    <div>
      <div className="border-b border-gridline px-6 sm:px-10 py-4">
        <Link href="/" className="inline-flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.svg" alt="" className="w-6 h-auto" aria-hidden />
          <span className="font-heading font-semibold text-[12.5px] tracking-[0.04em]">
            GROUNDED <span className="font-normal text-brand">SKILLS LAB</span>
          </span>
        </Link>
      </div>
      <BetaFormClient />
      <MarketingFooter />
    </div>
  );
}

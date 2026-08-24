import Link from "next/link";
import { MarketingNav } from "@/components/marketing/Nav";
import { MarketingFooter } from "@/components/marketing/Footer";

export const metadata = {
  title: "Terms of Service — Grounded Skills Lab",
};

const EFFECTIVE_DATE = "August 24, 2026";

export default function TermsPage() {
  return (
    <div>
      <MarketingNav />
      <main className="max-w-[760px] mx-auto px-6 sm:px-10 py-14 sm:py-20 pb-24">
        <div className="font-heading font-semibold text-xs tracking-[0.16em] uppercase text-brand-ink">Legal</div>
        <h1 className="font-heading font-bold text-[28px] sm:text-[34px] mt-3">Terms of Service</h1>
        <p className="text-sm text-stone mt-2">Effective {EFFECTIVE_DATE}</p>

        <div className="prose-legal mt-8 text-[15px] leading-[1.65] text-[#2c2c2c] [&_h2]:font-heading [&_h2]:font-semibold [&_h2]:text-lg [&_h2]:text-ink [&_h2]:mt-9 [&_h2]:mb-3 [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:pl-5 [&_ul]:list-disc [&_li]:mb-2 [&_strong]:text-ink [&_a]:text-brand-ink [&_a]:underline">
          <p>
            These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of Grounded Skills Lab
            (&ldquo;Grounded,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;) — our website, beta program, and product. By
            requesting beta access, creating an account, or otherwise using Grounded, you agree to these Terms.
          </p>

          <h2>1. Beta status</h2>
          <p>
            Grounded is currently in beta. That means the product, its features, and this beta program may change,
            be added to, or be removed at any time without notice, and the service is provided without any guarantee
            of uptime, continuity, or feature stability. We&rsquo;ll try to give you a heads-up on major changes, but
            beta software should not be relied on as your sole system of record for anything critical.
          </p>

          <h2>2. Who can use Grounded</h2>
          <p>
            You must be at least 18 years old, or the age of majority in your jurisdiction, to create an account.
            Grounded is intended for use by adults — coaches, practitioners, educators, and caregivers — including
            when tracking the practice or progress of a minor in their care. It is not intended for direct use by
            children.
          </p>

          <h2>3. Not medical, clinical, or professional advice</h2>
          <p>
            Grounded is a structured data-tracking and organization tool. It is not a medical device, a clinical
            decision-making system, and does not provide medical, therapeutic, behavioral-health, or professional
            advice of any kind. Any pattern, trend, or summary the product surfaces is a description of the data you
            entered — never a diagnosis, treatment recommendation, or substitute for the judgment of a qualified
            professional. You remain solely responsible for the professional, clinical, or educational decisions you
            make, with or without Grounded.
          </p>

          <h2>4. Your account</h2>
          <p>
            You&rsquo;re responsible for keeping your login credentials secure and for all activity under your
            account. Tell us right away if you suspect unauthorized access. If your account was created by an
            organization you belong to, that organization may also have rights to manage or remove your access under
            its own agreement with us.
          </p>

          <h2>5. Data you enter</h2>
          <p>
            You retain ownership of the practice, session, and program data you or your organization enter into
            Grounded. You grant us the limited right to store, process, and display that data back to you and
            whoever you&rsquo;ve authorized within the product, solely to provide the service. You&rsquo;re
            responsible for having the right to enter any data you submit, including data about another person (see
            our <Link href="/privacy" className="underline">Privacy Policy</Link>, Section 3, on entering information
            about minors).
          </p>

          <h2>6. Acceptable use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use Grounded for anything unlawful, or to store information you don&rsquo;t have the right to store.</li>
            <li>Attempt to access accounts, data, or systems that aren&rsquo;t yours.</li>
            <li>Interfere with or disrupt the service, or attempt to reverse-engineer it beyond what the law allows.</li>
            <li>Misrepresent your identity or your relationship to the people whose data you&rsquo;re entering.</li>
          </ul>

          <h2>7. Beta feedback</h2>
          <p>
            If you send us feedback, suggestions, or ideas about the product, you agree we can use them to improve
            Grounded without any obligation to you, and without them being treated as your confidential information.
          </p>

          <h2>8. Intellectual property</h2>
          <p>
            Grounded — the software, design, branding, and content we create — belongs to us or our licensors. These
            Terms don&rsquo;t grant you any rights to our intellectual property beyond what&rsquo;s needed to use the
            product as intended.
          </p>

          <h2>9. Termination</h2>
          <p>
            You can stop using Grounded and request account deletion at any time. We may suspend or terminate access
            if we reasonably believe these Terms have been violated, or if we discontinue the beta program or the
            service. Where reasonably possible, we&rsquo;ll give notice first.
          </p>

          <h2>10. Disclaimer of warranties</h2>
          <p>
            Grounded is provided &ldquo;as is&rdquo; and &ldquo;as available,&rdquo; without warranties of any kind,
            express or implied, including any warranty of merchantability, fitness for a particular purpose, or
            non-infringement — especially given its current beta status.
          </p>

          <h2>11. Limitation of liability</h2>
          <p>
            To the maximum extent permitted by law, Grounded and its team are not liable for any indirect,
            incidental, special, or consequential damages arising from your use of the service, including loss of
            data, loss of profits, or business interruption, even if we&rsquo;ve been advised of the possibility. Our
            total liability for any claim relating to the service is limited to the amount, if any, you paid us in
            the twelve months before the claim arose.
          </p>

          <h2>12. Governing law</h2>
          <p>
            These Terms are governed by the laws of the State of Oregon, without regard to its conflict-of-laws
            principles, without limiting whatever rights California residents have under Section 9 of our{" "}
            <Link href="/privacy" className="underline">Privacy Policy</Link>.
          </p>

          <h2>13. Changes to these Terms</h2>
          <p>
            We may update these Terms as the product changes. If we make material changes, we&rsquo;ll update the
            effective date above and, where appropriate, let active users know directly. Continuing to use Grounded
            after a change means you accept the updated Terms.
          </p>

          <h2>14. Contact us</h2>
          <p>
            Questions about these Terms can be sent to{" "}
            <a href="mailto:hello@groundedskillslab.com">hello@groundedskillslab.com</a>.
          </p>
        </div>

        <p className="mt-10 text-sm">
          <Link href="/privacy" className="font-heading font-semibold text-brand-ink border-b border-brand-ink pb-0.5">
            Read our Privacy Policy →
          </Link>
        </p>
      </main>
      <MarketingFooter />
    </div>
  );
}

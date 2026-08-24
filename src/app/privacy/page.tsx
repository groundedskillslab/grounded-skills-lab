import Link from "next/link";
import { MarketingNav } from "@/components/marketing/Nav";
import { MarketingFooter } from "@/components/marketing/Footer";

export const metadata = {
  title: "Privacy Policy — Grounded Skills Lab",
};

const EFFECTIVE_DATE = "August 24, 2026";

export default function PrivacyPage() {
  return (
    <div>
      <MarketingNav />
      <main className="max-w-[760px] mx-auto px-6 sm:px-10 py-14 sm:py-20 pb-24">
        <div className="font-heading font-semibold text-xs tracking-[0.16em] uppercase text-brand-ink">Legal</div>
        <h1 className="font-heading font-bold text-[28px] sm:text-[34px] mt-3">Privacy Policy</h1>
        <p className="text-sm text-stone mt-2">Effective {EFFECTIVE_DATE}</p>

        <div className="prose-legal mt-8 text-[15px] leading-[1.65] text-[#2c2c2c] [&_h2]:font-heading [&_h2]:font-semibold [&_h2]:text-lg [&_h2]:text-ink [&_h2]:mt-9 [&_h2]:mb-3 [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:pl-5 [&_ul]:list-disc [&_li]:mb-2 [&_strong]:text-ink [&_a]:text-brand-ink [&_a]:underline">
          <p>
            Grounded Skills Lab (&ldquo;Grounded,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;) builds a data-tracking tool for structured
            skill practice. This policy explains what information we collect through our website and product, why we
            collect it, and the choices you have.
          </p>

          <h2>1. Who this applies to</h2>
          <p>
            This policy covers our marketing site, our beta-access signup, and the Grounded product itself once you
            have an account. If you use Grounded as a coach, practitioner, educator, or caregiver to track someone
            else&rsquo;s practice or progress, both your information and the information you enter about that person
            are covered here.
          </p>

          <h2>2. Information we collect</h2>
          <p><strong>When you request beta access</strong>, we collect what you submit on that form: your name, email
            address, the skill you&rsquo;re working on (optional), which role best describes you, what you&rsquo;re
            interested in, and any note you add.</p>
          <p><strong>When you have a product account</strong>, we collect your account information (name, email) and
            whatever practice, session, or program data you or your organization choose to enter — for example,
            skill definitions, session logs, fidelity checks, or progress notes. That data is yours; we store and
            process it so the product can function, and we don&rsquo;t use it for anything else.</p>
          <p><strong>Automatically</strong>, our authentication system sets a small number of cookies needed to keep
            you signed in securely. We do not currently run third-party analytics, advertising, or tracking scripts
            on the site.</p>

          <h2>3. Information about minors you enter as a professional or caregiver</h2>
          <p>
            Grounded is built for use by adults — coaches, practitioners, educators, and caregivers — who may enter
            information about a child or other minor in their care as part of tracking that person&rsquo;s skill
            practice. If that&rsquo;s you, you&rsquo;re responsible for having the appropriate authority and, where
            applicable, consent to enter that information. We do not knowingly collect personal information directly
            from children under 13 through our own signup or account-creation flows, since those are intended for
            the adult professional or caregiver, not the minor. If you believe a minor has provided us information
            directly, contact us using the details below and we&rsquo;ll address it.
          </p>

          <h2>4. How we use information</h2>
          <ul>
            <li>To operate and improve the product and the beta program.</li>
            <li>To communicate with you — beta updates, account or security notices, and responses to your questions.</li>
            <li>To keep the service secure and prevent misuse.</li>
          </ul>
          <p>We do not sell your personal information, and we do not use the practice or session data you enter for
            advertising.</p>

          <h2>5. Where and how information is stored</h2>
          <p>
            Product and account data is stored in a managed Postgres database (via Supabase) hosted in the United
            States, and the application itself is hosted on Vercel. Data is encrypted in transit. Access is limited
            to what a given role needs — for example, a coach can generally see the participants assigned to them,
            not an entire organization&rsquo;s caseload.
          </p>

          <h2>6. Sharing and disclosure</h2>
          <p>We share information only with:</p>
          <ul>
            <li>Service providers who host or run the infrastructure the product depends on (currently Supabase and Vercel), under their own security and confidentiality commitments.</li>
            <li>Other people you or your organization explicitly grant access to within the product (for example, a coach you invite onto a shared case).</li>
            <li>Authorities, if required by law, or to protect the rights, safety, or property of Grounded, our users, or others.</li>
          </ul>
          <p>We do not sell personal information to third parties.</p>

          <h2>7. Data retention</h2>
          <p>
            We keep beta-signup information while the beta program is active and for a reasonable period afterward
            for follow-up. We keep product/account data for as long as your account is active, or as needed to
            provide the service. You can ask us to delete your account and associated data at any time — see Section
            8.
          </p>

          <h2>8. Your rights and choices</h2>
          <p>You can ask us to:</p>
          <ul>
            <li>Give you a copy of the personal information we hold about you.</li>
            <li>Correct inaccurate information.</li>
            <li>Delete your account and associated personal information, subject to any data we&rsquo;re required to keep for legal or legitimate business reasons.</li>
          </ul>
          <p>To do any of this, contact us using the details in Section 11.</p>

          <h2>9. California residents</h2>
          <p>
            If you are a California resident, the California Consumer Privacy Act (CCPA), as amended, gives you
            additional rights over your personal information, including the right to know what we&rsquo;ve collected,
            to request deletion, to correct inaccuracies, and to not be discriminated against for exercising these
            rights. We do not sell or &ldquo;share&rdquo; personal information as those terms are defined under the
            CCPA. You can exercise these rights using the contact details in Section 11.
          </p>

          <h2>10. Children&rsquo;s privacy</h2>
          <p>
            Grounded&rsquo;s own signup and account-creation flows are not directed at children under 13, and we do
            not knowingly collect personal information directly from them. See Section 3 for how this applies when a
            professional or caregiver enters information about a minor in their care.
          </p>

          <h2>11. Contact us</h2>
          <p>
            Questions about this policy, or requests related to your information, can be sent to{" "}
            <a href="mailto:privacy@groundedskillslab.com">privacy@groundedskillslab.com</a>.
          </p>

          <h2>12. Changes to this policy</h2>
          <p>
            We may update this policy as the product changes. If we make material changes, we&rsquo;ll update the
            effective date above and, where appropriate, let active users know directly.
          </p>
        </div>

        <p className="mt-10 text-sm">
          <Link href="/terms" className="font-heading font-semibold text-brand-ink border-b border-brand-ink pb-0.5">
            Read our Terms of Service →
          </Link>
        </p>
      </main>
      <MarketingFooter />
    </div>
  );
}

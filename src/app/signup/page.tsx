import Link from "next/link";
import { SignupForm } from "@/components/SignupForm";
import { signUpIndependent } from "@/actions/signup";

export default function SignupPage() {
  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-ink text-white">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="" className="h-6 w-6" aria-hidden />
          <div className="font-heading text-sm tracking-widest uppercase text-white/60">Grounded Skills Lab</div>
        </div>
        <div className="max-w-md">
          <h1 className="text-3xl font-medium leading-tight mb-4">
            Working on your own skills — no coach required.
          </h1>
          <p className="text-white/70 leading-relaxed">
            Define what you&apos;re building, practice with intention, and measure whether it&apos;s
            actually working — all in your own private space.
          </p>
        </div>
        <div className="text-white/40 text-sm">Define → Teach → Practice → Measure → Analyze → Adjust → Generalize → Maintain</div>
      </div>

      <div className="flex flex-col justify-center px-6 sm:px-12 py-12">
        <div className="max-w-sm w-full mx-auto">
          <h2 className="text-2xl font-medium mb-1">Create your account</h2>
          <p className="text-ink-secondary mb-8 text-sm">
            For working on your own — you&apos;ll get your own private space to build programs,
            practice, and track your progress.
          </p>

          <SignupForm action={signUpIndependent} />

          <p className="text-xs text-ink-muted mt-6">
            Working with a coach, practitioner, or organization instead? They&apos;ll send you an
            invite by email — you don&apos;t need to sign up here.
          </p>

          <p className="text-sm mt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-brand underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

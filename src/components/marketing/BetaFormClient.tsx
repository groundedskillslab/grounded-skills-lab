"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { submitBetaSignup, type BetaFormState } from "@/actions/beta";

const DESCRIBES_YOU = ["Practicing independently", "Coach", "Practitioner", "Educator", "Other"];
const INTERESTED_IN = ["App", "Practice Journal", "Both"];

const initialState: BetaFormState = { error: null, success: false };

function OptionGroup({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {options.map((opt) => {
        const selected = value === opt;
        return (
          <label
            key={opt}
            className={`flex items-center gap-2.5 px-3.5 py-3 border rounded-[5px] cursor-pointer transition ${
              selected ? "border-brand bg-brand-soft" : "border-[#ddd8cc]"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={opt}
              checked={selected}
              onChange={() => onChange(opt)}
              className="w-[18px] h-[18px] shrink-0 accent-[var(--brand)]"
            />
            {opt}
          </label>
        );
      })}
    </div>
  );
}

export function BetaFormClient() {
  const [state, formAction, pending] = useActionState(submitBetaSignup, initialState);
  const [describesYou, setDescribesYou] = useState(DESCRIBES_YOU[0]);
  const [interestedIn, setInterestedIn] = useState(INTERESTED_IN[0]);

  if (state.success) {
    return (
      <div className="max-w-[640px] mx-auto px-6 sm:px-10 py-16 sm:py-20 text-center">
        <div className="font-heading font-semibold text-xs tracking-[0.16em] uppercase text-brand-ink">Request received</div>
        <h1 className="font-heading font-bold text-[28px] mt-3">You&rsquo;re on the list.</h1>
        <p className="text-[15px] leading-[1.5] text-[#4a4a4a] mt-3">
          Thanks for your interest in Grounded Skills Lab — we&rsquo;ll reach out about the beta soon.
        </p>
        <Link href="/" className="inline-block mt-6 font-heading font-semibold text-sm text-brand-ink border-b border-brand-ink pb-0.5">
          ← Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[640px] mx-auto px-6 sm:px-10 py-14 sm:py-16 pb-20">
      <div className="font-heading font-semibold text-xs tracking-[0.16em] uppercase text-brand-ink">Request Beta Access</div>
      <h1 className="font-heading font-bold text-[26px] sm:text-[28px] mt-3">Help shape Grounded Skills Lab.</h1>
      <p className="text-[15px] leading-[1.5] text-[#4a4a4a] mt-3">A few quick details — no account or payment info needed.</p>

      <form action={formAction} className="mt-9 flex flex-col gap-6">
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="font-heading font-semibold text-sm mb-2 block" htmlFor="name">
              Name<span className="text-[#B34A3D] ml-0.5">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Jordan Lee"
              required
              className="w-full font-heading text-[15px] px-3.5 py-3.5 border border-[#c9c5bb] rounded-[5px] bg-white focus:outline-2 focus:outline-brand focus:border-brand"
            />
          </div>
          <div>
            <label className="font-heading font-semibold text-sm mb-2 block" htmlFor="email">
              Email<span className="text-[#B34A3D] ml-0.5">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="jordan@example.com"
              required
              className="w-full font-heading text-[15px] px-3.5 py-3.5 border border-[#c9c5bb] rounded-[5px] bg-white focus:outline-2 focus:outline-brand focus:border-brand"
            />
          </div>
        </div>

        <div>
          <label className="font-heading font-semibold text-sm mb-2 block" htmlFor="skillFocus">
            What skill are you currently trying to improve?
          </label>
          <input
            id="skillFocus"
            name="skillFocus"
            type="text"
            placeholder="e.g. a specific technique, a piece of music, a classroom routine"
            className="w-full font-heading text-[15px] px-3.5 py-3.5 border border-[#c9c5bb] rounded-[5px] bg-white focus:outline-2 focus:outline-brand focus:border-brand"
          />
        </div>

        <div>
          <label className="font-heading font-semibold text-sm mb-2 block">
            Which best describes you?<span className="text-[#B34A3D] ml-0.5">*</span>
          </label>
          <input type="hidden" name="describesYou" value={describesYou} />
          <OptionGroup name="role" options={DESCRIBES_YOU} value={describesYou} onChange={setDescribesYou} />
        </div>

        <div>
          <label className="font-heading font-semibold text-sm mb-2 block">
            Interested in<span className="text-[#B34A3D] ml-0.5">*</span>
          </label>
          <input type="hidden" name="interestedIn" value={interestedIn} />
          <OptionGroup name="interest" options={INTERESTED_IN} value={interestedIn} onChange={setInterestedIn} />
        </div>

        <div>
          <label className="font-heading font-semibold text-sm mb-2 block" htmlFor="note">
            Anything else? <span className="font-normal text-stone normal-case tracking-normal">(optional)</span>
          </label>
          <textarea
            id="note"
            name="note"
            placeholder="Optional note"
            rows={4}
            className="w-full font-heading text-[15px] px-3.5 py-3.5 border border-[#c9c5bb] rounded-[5px] bg-white resize-y min-h-[90px] focus:outline-2 focus:outline-brand focus:border-brand"
          />
        </div>

        {state.error && (
          <div className="flex items-center gap-2 text-[13px] text-[#B34A3D] font-heading">
            <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden>
              <circle cx="8" cy="8" r="6.5" fill="none" stroke="#B34A3D" strokeWidth={1.4} />
              <path d="M8 4.8V8.6" stroke="#B34A3D" strokeWidth={1.4} strokeLinecap="round" />
              <circle cx="8" cy="11" r="0.9" fill="#B34A3D" />
            </svg>
            {state.error}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="flex items-center justify-center gap-2 bg-ink text-white font-heading font-semibold text-base rounded-[5px] px-6 py-4 w-full mt-1 disabled:opacity-60 hover:bg-black transition"
        >
          {pending ? "Submitting…" : "Request Beta Access"}
        </button>
        <p className="font-heading text-xs text-stone text-center">
          We&rsquo;ll only use this to reach out about the beta — nothing else.
        </p>
      </form>
    </div>
  );
}

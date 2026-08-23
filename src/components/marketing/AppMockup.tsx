// Shared "app screen" mockup primitives used across the marketing site's
// product-preview cards. Deliberately built from the real brand tokens
// already in globals.css (bg-ink, text-brand, etc.) rather than a
// screenshot of any actual app — see the design rationale doc: these
// mockups follow the brand visual guide, not a borrowed reference.

export function AppFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[10px] overflow-hidden bg-ink border border-white/10 shadow-[0_30px_60px_-20px_rgba(20,20,18,0.35)] ${className}`}>
      <div className="flex items-center gap-1.5 px-3.5 py-2.5 border-b border-white/10">
        <span className="h-2 w-2 rounded-full bg-white/20" />
        <span className="h-2 w-2 rounded-full bg-white/20" />
        <span className="h-2 w-2 rounded-full bg-white/20" />
      </div>
      {children}
    </div>
  );
}

export function AppSub({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`font-heading font-semibold text-[8px] tracking-[0.08em] uppercase text-brand ${className}`}>
      {children}
    </div>
  );
}

export function AppCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white/[0.06] border border-white/10 rounded-[7px] p-3.5 ${className}`}>{children}</div>;
}

export function AppAvatar({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`h-[34px] w-[34px] shrink-0 rounded-full bg-white/10 text-white font-heading font-semibold text-xs flex items-center justify-center ${className}`}
    >
      {children}
    </div>
  );
}

export function AppName({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`font-heading font-semibold text-[13px] text-white ${className}`}>{children}</div>;
}

export function AppMeta({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`font-heading text-[11px] text-white/55 ${className}`}>{children}</div>;
}

export function AppTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block font-heading font-semibold text-[9px] tracking-[0.05em] uppercase px-1.5 py-1 rounded bg-[#7A8F72]/20 text-[#9db894]">
      {children}
    </span>
  );
}

export function AppBtn({ children, outline = false, className = "" }: { children: React.ReactNode; outline?: boolean; className?: string }) {
  return outline ? (
    <div
      className={`font-heading font-semibold text-[11px] text-white text-center border border-white/15 rounded-[5px] px-4 py-2 ${className}`}
    >
      {children}
    </div>
  ) : (
    <div className={`font-heading font-semibold text-[11px] text-ink bg-brand text-center rounded-[5px] px-4 py-2 ${className}`}>
      {children}
    </div>
  );
}

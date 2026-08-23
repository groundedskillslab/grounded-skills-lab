// Shared line icons for the public marketing site — single stroke weight,
// Accent Gold, 24px viewBox. Matches the approved design canvas exactly
// (Rationale/Components artboards, "Icons" section).

function IconWrap({ children, size = 24 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className="stroke-brand fill-none"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function PracticeIcon({ size }: { size?: number }) {
  return (
    <IconWrap size={size}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5.2" />
      <circle cx="12" cy="12" r="1.6" fill="var(--brand)" stroke="none" />
    </IconWrap>
  );
}

export function MeasureIcon({ size }: { size?: number }) {
  return (
    <IconWrap size={size}>
      <path d="M4 16 A8 8 0 0 1 20 16" />
      <path d="M12 16 L16 10.5" />
      <circle cx="12" cy="16" r="1.3" fill="var(--brand)" stroke="none" />
    </IconWrap>
  );
}

export function ImproveIcon({ size }: { size?: number }) {
  return (
    <IconWrap size={size}>
      <path d="M4 17 L10 11 L14 14 L20 6.5" />
      <path d="M15 6 H20 V11" />
    </IconWrap>
  );
}

export function RepeatIcon({ size }: { size?: number }) {
  return (
    <IconWrap size={size}>
      <path d="M6 9 A6 6 0 0 1 17.5 8.3" />
      <path d="M17 5.5 L17.8 8.6 L14.6 8.9" />
      <path d="M18 15 A6 6 0 0 1 6.5 15.7" />
      <path d="M7 18.5 L6.2 15.4 L9.4 15.1" />
    </IconWrap>
  );
}

export function CoachIcon({ size }: { size?: number }) {
  return (
    <IconWrap size={size}>
      <circle cx="9" cy="9" r="3.1" />
      <path d="M4 19c0-3 2.2-5 5-5s5 2 5 5" />
      <circle cx="17" cy="8" r="2.5" />
      <path d="M14.6 19c.3-2.6 1.8-4.3 3.6-4.3" />
    </IconWrap>
  );
}

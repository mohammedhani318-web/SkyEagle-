type Props = { className?: string; showText?: boolean; tagline?: string };

export function EagleMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="30" fill="#0a1a33" stroke="#d4a935" strokeWidth="2" />
      {/* stylized eagle in flight */}
      <path
        d="M32 14 L36 24 L54 20 L42 30 L46 42 L32 36 L18 42 L22 30 L10 20 L28 24 Z"
        fill="#d4a935"
      />
      <path d="M32 24 L35 34 L32 46 L29 34 Z" fill="#38bdf8" />
    </svg>
  );
}

export default function Logo({ className, showText = true, tagline }: Props) {
  return (
    <span className="inline-flex items-center gap-3">
      <EagleMark className={className} />
      {showText && (
        <span className="flex flex-col leading-tight">
          <span className="text-lg font-extrabold tracking-wide">
            Sky<span className="text-gold-500">Eagle</span>
          </span>
          {tagline && (
            <span className="text-[11px] font-medium opacity-70">{tagline}</span>
          )}
        </span>
      )}
    </span>
  );
}

// Original PharmFetch mark: a rounded badge holding a two-tone capsule glyph.
// Not a lettermark/wordmark copy of any other pharmacy brand.
export default function Logo({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="10" fill="var(--accent)" />
      <g transform="translate(5.5,12) rotate(-22 10 4)">
        <rect x="0" y="0" width="20" height="8" rx="4" fill="#ffffff" />
        <path d="M10 0H16C18.2091 0 20 1.79086 20 4C20 6.20914 18.2091 8 16 8H10V0Z" fill="var(--sage)" />
      </g>
    </svg>
  );
}

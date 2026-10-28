// Original PharmFetch mark: a rounded badge holding a small test-tube glyph,
// filled like a lab sample. Not a lettermark/wordmark copy of any other pharmacy brand.
export default function Logo({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="10" fill="var(--accent)" />
      <rect x="11.5" y="5" width="9" height="2" rx="1" fill="#ffffff" />
      <path d="M13 6.5h6V20a3 3 0 0 1-3 3v0a3 3 0 0 1-3-3V6.5z" fill="#ffffff" />
      <path d="M13 15h6v5a3 3 0 0 1-3 3v0a3 3 0 0 1-3-3v-5z" fill="var(--sage)" />
      <circle cx="15.1" cy="11.5" r="1" fill="var(--sage)" />
      <circle cx="17.3" cy="9.6" r="0.75" fill="var(--sage)" />
    </svg>
  );
}

// Decorative delivery-scooter illustration, brand tokens only (forest teal / sage / off-white).
export default function HeroArt() {
  return (
    <svg viewBox="0 0 220 160" width="220" height="160" fill="none" aria-hidden="true" focusable="false">
      <circle cx="112" cy="84" r="72" fill="var(--sage)" />
      <g stroke="var(--mute-2)" strokeWidth="2.5" strokeLinecap="round" opacity="0.55">
        <path d="M16 96h22" />
        <path d="M8 109h26" />
        <path d="M18 122h20" />
      </g>
      <g stroke="var(--accent)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="70" cy="112" r="14" fill="var(--bg)" />
        <circle cx="150" cy="112" r="14" fill="var(--bg)" />
        <path d="M70 112h24l15-34h26" fill="none" />
        <path d="M131 78l19 34" fill="none" />
        <path d="M106 78h21" fill="none" />
      </g>
      <rect x="120" y="48" width="32" height="26" rx="4" fill="var(--accent-secondary)" fillOpacity="0.2" stroke="var(--accent-secondary)" strokeWidth="2.4" />
    </svg>
  );
}

// Hero banner illustration: a rider on a delivery scooter, brand tokens only
// (forest teal / sage / warm off-white). Lives inside a colored .hero-banner card.
export default function HeroArt() {
  return (
    <svg viewBox="0 0 400 220" fill="none" aria-hidden="true" focusable="false">
      {/* sky: clouds */}
      <g fill="var(--card)" opacity="0.55">
        <ellipse cx="95" cy="40" rx="30" ry="16" />
        <ellipse cx="118" cy="50" rx="20" ry="12" />
        <ellipse cx="300" cy="38" rx="24" ry="13" />
      </g>

      {/* pharmacy badge, top right */}
      <circle cx="340" cy="58" r="19" fill="var(--card)" stroke="var(--accent)" strokeWidth="2.5" />
      <path d="M340 49v18M331 58h18" stroke="var(--accent)" strokeWidth="3.4" strokeLinecap="round" />

      {/* map pin, top left */}
      <path d="M46 56c0-11 8.5-19 19-19s19 8 19 19c0 14-19 32-19 32S46 70 46 56z" fill="var(--accent-secondary)" />
      <circle cx="65" cy="55" r="7.5" fill="var(--card)" />

      {/* mini skyline */}
      <g fill="var(--card)" opacity="0.5">
        <rect x="16" y="196" width="24" height="22" rx="3" />
        <rect x="46" y="186" width="20" height="32" rx="3" />
        <rect x="334" y="190" width="22" height="28" rx="3" />
        <rect x="362" y="180" width="18" height="38" rx="3" />
      </g>

      {/* road */}
      <path d="M10 206Q200 224 390 206" stroke="var(--mute-2)" strokeWidth="3" strokeDasharray="2 11" strokeLinecap="round" opacity="0.55" />

      {/* speed lines */}
      <g stroke="var(--mute-2)" strokeWidth="3.6" strokeLinecap="round" opacity="0.55">
        <path d="M58 150h30" />
        <path d="M48 163h34" />
        <path d="M62 176h26" />
      </g>

      {/* scooter body */}
      <g stroke="var(--accent)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round">
        <path d="M160 176h90" />
        <path d="M250 176l20-62" />
        <path d="M182 176l-6-40" />
      </g>
      <path d="M258 114h26" stroke="var(--accent)" strokeWidth="9" strokeLinecap="round" />
      <rect x="159" y="127" width="36" height="15" rx="7.5" fill="var(--accent)" />

      {/* wheels */}
      <circle cx="160" cy="176" r="24" fill="var(--accent-hover)" />
      <circle cx="160" cy="176" r="10" fill="var(--sage)" />
      <circle cx="280" cy="176" r="24" fill="var(--accent-hover)" />
      <circle cx="280" cy="176" r="10" fill="var(--sage)" />

      {/* delivery box */}
      <rect x="118" y="106" width="42" height="36" rx="6" fill="var(--accent-secondary)" />
      <path d="M139 115v18M130 124h18" stroke="var(--bg)" strokeWidth="4" strokeLinecap="round" />

      {/* rider */}
      <path d="M206 140L196 170 214 174 222 146Z" fill="var(--accent-hover)" />
      <path d="M246 108C228 116 214 128 206 140L222 146C230 130 242 118 258 110Z" fill="var(--accent-hover)" />
      <path d="M248 102L268 112" stroke="var(--accent-hover)" strokeWidth="9" strokeLinecap="round" />
      <circle cx="255" cy="96" r="16" fill="var(--accent-hover)" />
      <rect x="244" y="92" width="24" height="7" rx="3.5" fill="var(--sage)" />
    </svg>
  );
}

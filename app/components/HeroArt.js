// Hero banner illustration: a rider on a delivery scooter, brand tokens only
// (forest teal / sage / warm off-white). Lives inside a colored .hero-banner card.
export default function HeroArt() {
  return (
    <svg viewBox="0 0 400 220" fill="none" aria-hidden="true" focusable="false">
      {/* sky: clouds */}
      <g fill="var(--card)" opacity="0.55">
        <ellipse cx="95" cy="40" rx="30" ry="16" />
        <ellipse cx="118" cy="50" rx="20" ry="12" />
      </g>

      {/* molecule motifs */}
      <g stroke="var(--accent-secondary)" strokeWidth="1.6" opacity="0.8">
        <line x1="198" y1="34" x2="188" y2="22" />
        <line x1="198" y1="34" x2="210" y2="24" />
        <line x1="198" y1="34" x2="202" y2="48" />
      </g>
      <circle cx="198" cy="34" r="4" fill="var(--accent-secondary)" />
      <circle cx="188" cy="22" r="2.6" fill="var(--card)" stroke="var(--accent-secondary)" strokeWidth="1.6" />
      <circle cx="210" cy="24" r="2.6" fill="var(--card)" stroke="var(--accent-secondary)" strokeWidth="1.6" />
      <circle cx="202" cy="48" r="2.6" fill="var(--card)" stroke="var(--accent-secondary)" strokeWidth="1.6" />

      <g stroke="var(--accent)" strokeWidth="1.4" opacity="0.65">
        <line x1="296" y1="76" x2="288" y2="66" />
        <line x1="296" y1="76" x2="306" y2="68" />
      </g>
      <circle cx="296" cy="76" r="3.4" fill="var(--accent)" opacity="0.65" />
      <circle cx="288" cy="66" r="2.2" fill="var(--card)" stroke="var(--accent)" strokeWidth="1.4" opacity="0.65" />
      <circle cx="306" cy="68" r="2.2" fill="var(--card)" stroke="var(--accent)" strokeWidth="1.4" opacity="0.65" />

      {/* sparkles */}
      <path d="M262 30C262 34 263 36 267 37C263 38 262 40 262 44C262 40 261 38 257 37C261 36 262 34 262 30Z" fill="var(--accent-secondary)" opacity="0.8" />
      <path d="M58 84C58 87 59 88 62 89C59 90 58 91 58 94C58 91 57 90 54 89C57 88 58 87 58 84Z" fill="var(--accent)" opacity="0.6" />

      {/* floating capsule */}
      <g transform="translate(244,42) rotate(-24)">
        <rect x="0" y="0" width="38" height="14" rx="7" fill="var(--sage)" stroke="var(--accent)" strokeWidth="1.2" />
        <path d="M19 0H31C34.866 0 38 3.134 38 7C38 10.866 34.866 14 31 14H19V0Z" fill="var(--accent)" />
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

      {/* route, drawn as a heartbeat */}
      <path d="M10 206H64L76 190L90 222L102 198L112 206H390" stroke="var(--accent-secondary)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.65" />

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

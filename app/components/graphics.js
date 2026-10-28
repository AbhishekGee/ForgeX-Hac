// Pharma-science decorative graphics: molecules, capsules, a pill bottle, sparkles,
// a heartbeat line. Brand tokens only (forest teal / sage / warm off-white).

export function Molecule({ size = 48, color = 'var(--accent)', className, style }) {
  return (
    <svg className={className} style={style} width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <line x1="24" y1="24" x2="8" y2="12" stroke={color} strokeWidth="2" />
      <line x1="24" y1="24" x2="40" y2="10" stroke={color} strokeWidth="2" />
      <line x1="24" y1="24" x2="10" y2="38" stroke={color} strokeWidth="2" />
      <line x1="24" y1="24" x2="38" y2="36" stroke={color} strokeWidth="2" />
      <circle cx="24" cy="24" r="5.5" fill={color} />
      <circle cx="8" cy="12" r="4" fill="var(--bg)" stroke={color} strokeWidth="2" />
      <circle cx="40" cy="10" r="4" fill="var(--bg)" stroke={color} strokeWidth="2" />
      <circle cx="10" cy="38" r="4" fill="var(--bg)" stroke={color} strokeWidth="2" />
      <circle cx="38" cy="36" r="4" fill="var(--bg)" stroke={color} strokeWidth="2" />
    </svg>
  );
}

export function Sparkle({ size = 18, color = 'var(--accent-secondary)', className, style }) {
  return (
    <svg className={className} style={style} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 0C12 6 14 10 20 12C14 14 12 18 12 24C12 18 10 14 4 12C10 10 12 6 12 0Z" fill={color} />
    </svg>
  );
}

export function PillCapsule({ width = 86, height = 32, rotate = -18, className, style }) {
  return (
    <svg className={className} style={{ transform: `rotate(${rotate}deg)`, ...style }} width={width} height={height} viewBox="0 0 86 32" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="84" height="30" rx="15" fill="var(--sage)" stroke="var(--accent)" strokeWidth="1.6" />
      <path d="M43 1H70C78.2843 1 85 7.71573 85 16C85 24.2843 78.2843 31 70 31H43V1Z" fill="var(--accent)" />
      <ellipse cx="18" cy="9" rx="9" ry="3" fill="var(--bg)" fillOpacity="0.5" />
    </svg>
  );
}

export function PillBottle({ size = 108, className, style }) {
  const h = Math.round(size * 1.22);
  return (
    <svg className={className} style={style} width={size} height={h} viewBox="0 0 100 122" fill="none" aria-hidden="true">
      <rect x="35" y="2" width="30" height="15" rx="3" fill="var(--accent-hover)" />
      <line x1="38" y1="6" x2="62" y2="6" stroke="var(--bg)" strokeOpacity="0.45" strokeWidth="1.5" />
      <line x1="38" y1="10" x2="62" y2="10" stroke="var(--bg)" strokeOpacity="0.45" strokeWidth="1.5" />
      <line x1="38" y1="14" x2="62" y2="14" stroke="var(--bg)" strokeOpacity="0.45" strokeWidth="1.5" />
      <rect x="18" y="17" width="64" height="100" rx="16" fill="var(--card)" stroke="var(--accent)" strokeWidth="2.6" />
      <circle cx="33" cy="40" r="6.5" fill="var(--accent-secondary)" />
      <circle cx="50" cy="33" r="6.5" fill="var(--accent)" />
      <circle cx="67" cy="41" r="6.5" fill="var(--accent-secondary)" />
      <circle cx="42" cy="50" r="6.5" fill="var(--accent)" />
      <circle cx="59" cy="52" r="6.5" fill="var(--accent-secondary)" />
      <rect x="25" y="62" width="50" height="28" rx="5" fill="var(--bg)" stroke="var(--accent-secondary)" strokeWidth="2" />
    </svg>
  );
}

export function HeartbeatLine({ width = 160, height = 28, color = 'var(--mute-2)', className, style }) {
  return (
    <svg className={className} style={style} width={width} height={height} viewBox="0 0 160 28" fill="none" aria-hidden="true">
      <path d="M0 14H36L44 3L54 25L62 14H160" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

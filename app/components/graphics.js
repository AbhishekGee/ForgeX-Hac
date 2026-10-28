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

export function HeartbeatLine({ width = 160, height = 28, color = 'var(--mute-2)', className, style }) {
  return (
    <svg className={className} style={style} width={width} height={height} viewBox="0 0 160 28" fill="none" aria-hidden="true">
      <path d="M0 14H36L44 3L54 25L62 14H160" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

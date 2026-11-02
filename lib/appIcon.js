// The PharmFetch app icon: a line-drawn test tube on a sage-to-deep-teal gradient.
// One source for the favicon, the phone home-screen icon and the install icons.
//   rounded: draw the rounded tile (favicon); phones round full-bleed icons themselves.
//   scale:   shrink the mark, e.g. 0.8 to keep it inside Android's maskable safe zone.
export function appIconSvg({ rounded = false, scale = 1 } = {}) {
  const t = `translate(32 32) scale(${scale}) translate(-32 -32)`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#b9dfa9"/>
      <stop offset="0.34" stop-color="#6aa98a"/>
      <stop offset="0.7" stop-color="#1c6a6c"/>
      <stop offset="1" stop-color="#0a4450"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.18" cy="0.12" r="0.75">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.32"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="liquid" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e9f7e2"/>
      <stop offset="1" stop-color="#b6e2a8"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="${rounded ? 15 : 0}" fill="url(#bg)"/>
  <rect width="64" height="64" rx="${rounded ? 15 : 0}" fill="url(#glow)"/>
  <g transform="${t}">
    <path d="M25 15.5V42.5a7 7 0 0 0 14 0V15.5" fill="#ffffff" fill-opacity="0.1" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M21.5 14h21" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
    <path d="M28.6 30.5h6.8v12a3.4 3.4 0 0 1-6.8 0z" fill="url(#liquid)"/>
    <circle cx="30.9" cy="24.6" r="1.7" fill="#ffffff" fill-opacity="0.9"/>
    <circle cx="33.9" cy="20" r="1.15" fill="#ffffff" fill-opacity="0.75"/>
  </g>
</svg>`;
}

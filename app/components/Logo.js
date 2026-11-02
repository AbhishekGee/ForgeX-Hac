import { useId } from 'react';

// Original PharmFetch mark: a line-drawn test tube on a sage-to-deep-teal tile.
// Same art as the app icon (lib/appIcon.js). Not a copy of any other pharmacy brand.
export default function Logo({ size = 30 }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b9dfa9" />
          <stop offset="0.34" stopColor="#6aa98a" />
          <stop offset="0.7" stopColor="#1c6a6c" />
          <stop offset="1" stopColor="#0a4450" />
        </linearGradient>
        <linearGradient id={`${id}lq`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e9f7e2" />
          <stop offset="1" stopColor="#b6e2a8" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill={`url(#${id}bg)`} />
      <path d="M25 15.5V42.5a7 7 0 0 0 14 0V15.5" fill="#ffffff" fillOpacity="0.1" stroke="#ffffff" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21.5 14h21" stroke="#ffffff" strokeWidth="3.6" strokeLinecap="round" />
      <path d="M28.6 30.5h6.8v12a3.4 3.4 0 0 1-6.8 0z" fill={`url(#${id}lq)`} />
      <circle cx="30.9" cy="24.6" r="1.8" fill="#ffffff" fillOpacity="0.9" />
    </svg>
  );
}

export default function manifest() {
  return {
    name: 'PharmFetch',
    short_name: 'PharmFetch',
    description: 'Compare live prices from licensed pharmacies near you.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F2F4F0',
    theme_color: '#0F5D63',
    icons: [
      { src: '/app-icon/192.png', sizes: '192x192', type: 'image/png' },
      { src: '/app-icon/512.png', sizes: '512x512', type: 'image/png' },
      { src: '/app-icon/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
  };
}

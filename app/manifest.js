export default function manifest() {
  return {
    name: 'PharmFetch',
    short_name: 'PharmFetch',
    description: 'Compare live prices from licensed pharmacies near you.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F6F7FB',
    theme_color: '#2547F5',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
  };
}

export default function manifest() {
  return {
    name: 'PharmFetch',
    short_name: 'PharmFetch',
    description: 'AI-powered hyperlocal medicine delivery marketplace.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F8F7F2',
    theme_color: '#155E59',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
  };
}

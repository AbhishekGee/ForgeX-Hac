export default function manifest() {
  return {
    name: 'LastMinute Meds',
    short_name: 'LastMinute',
    description: 'AI-powered hyperlocal medicine delivery marketplace.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0071e3',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
  };
}

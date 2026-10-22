import './globals.css';
import NavBar from './components/NavBar.js';

export const metadata = {
  title: 'LastMinute Meds',
  description: 'AI reads your prescription and finds which nearby pharmacy has it in stock, with price, in seconds.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'LastMinute' },
};

export const viewport = {
  themeColor: '#0071e3',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <NavBar />
        <main>{children}</main>
        <footer className="foot">
          <p>Prototype marketplace with invented pharmacies, riders and demo data. Not medical advice.</p>
          <p>A pharmacist must check every prescription before anything is handed over.</p>
        </footer>
      </body>
    </html>
  );
}

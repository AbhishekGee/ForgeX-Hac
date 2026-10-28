import './globals.css';
import NavBar from './components/NavBar.js';
import NeuralBackground from './components/NeuralBackground.js';
import { IconShieldCheck, IconWallet, IconPharmacy, IconGlobe } from './components/icons.js';

const FOOT_FEATURES = [
  { Icon: IconShieldCheck, label: 'Pharmacist checked', sub: 'Every prescription reviewed' },
  { Icon: IconWallet, label: 'Pay on delivery', sub: 'No card needed (demo)' },
  { Icon: IconPharmacy, label: 'Verified pharmacies', sub: '5 demo partners nearby' },
  { Icon: IconGlobe, label: 'English & हिन्दी', sub: 'Dosage info, your language' },
];

export const metadata = {
  title: 'PharmFetch',
  description: 'AI reads your prescription and finds which nearby pharmacy has it in stock, with price, in seconds.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'PharmFetch' },
};

export const viewport = {
  themeColor: '#155E59',
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
        <div className="bg-canvas" aria-hidden="true">
          <span className="bg-blob b1" />
          <span className="bg-blob b2" />
          <span className="bg-blob b3" />
          <span className="bg-blob b4" />
        </div>
        <NeuralBackground />
        <NavBar />
        <main>{children}</main>
        <footer className="foot">
          <div className="foot-features">
            {FOOT_FEATURES.map(({ Icon, label, sub }) => (
              <div className="foot-feature" key={label}>
                <span className="foot-feature-icon"><Icon size={20} /></span>
                <strong>{label}</strong>
                <span>{sub}</span>
              </div>
            ))}
          </div>
          <p>Prototype marketplace with invented pharmacies, riders and demo data. Not medical advice.</p>
          <p>A pharmacist must check every prescription before anything is handed over.</p>
        </footer>
      </body>
    </html>
  );
}

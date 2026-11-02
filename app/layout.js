import './globals.css';
import NavBar from './components/NavBar.js';
import Logo from './components/Logo.js';

export const metadata = {
  title: 'PharmFetch — Medicines from pharmacies near you',
  description: 'Compare live prices from licensed pharmacies near you and get your medicines delivered.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'PharmFetch' },
};

export const viewport = {
  themeColor: '#0F5D63',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <NavBar />
        <main>{children}</main>
        <footer className="ftr">
          <div className="ftr-grid">
            <div className="ftr-brand">
              <a href="/" className="brand" aria-label="PharmFetch — home">
                <Logo size={32} />
                <span className="brand-word" aria-hidden="true">P<b>F</b></span>
              </a>
              <p>Live stock and prices from licensed pharmacies near you. Compare, order, and track your delivery in one place.</p>
            </div>
            <div className="ftr-col">
              <h4>Shop</h4>
              <a href="/">Medicines</a>
              <a href="/#pharmacies">Partner pharmacies</a>
              <a href="/#how">How it works</a>
            </div>
            <div className="ftr-col">
              <h4>For business</h4>
              <a href="/pharmacy">Pharmacy console</a>
              <a href="/partner">Delivery console</a>
              <a href="/admin">Admin</a>
            </div>
          </div>
          <p className="ftr-fine">Demo environment: pharmacies, riders and orders shown are sample data. Not medical advice. A pharmacist checks every prescription before anything is handed over.</p>
        </footer>
      </body>
    </html>
  );
}

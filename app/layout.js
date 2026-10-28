import './globals.css';
import NavBar from './components/NavBar.js';
import Logo from './components/Logo.js';

export const metadata = {
  title: 'PharmFetch',
  description: 'Medicines from licensed pharmacies near you, with live stock and prices, delivered.',
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
        <NavBar />
        <main>{children}</main>
        <footer className="foot">
          <div className="foot-inner">
            <div className="foot-brand">
              <a href="/" className="brand" aria-label="PharmFetch — home">
                <span className="brand-mark" aria-hidden="true"><Logo size={28} /></span>
                <span className="brand-word" aria-hidden="true"><span>P</span><b>F</b></span>
              </a>
              <p>Medicines from licensed pharmacies near you, with live stock and prices, delivered.</p>
            </div>
            <div className="foot-col">
              <h4>Shop</h4>
              <a href="/">Medicines</a>
              <a href="/#pharmacies">Partner pharmacies</a>
            </div>
            <div className="foot-col">
              <h4>For business</h4>
              <a href="/pharmacy">Pharmacy console</a>
              <a href="/partner">Delivery console</a>
              <a href="/admin">Admin</a>
            </div>
          </div>
          <p className="foot-fine">Demo environment: pharmacies, riders and orders shown are sample data. Not medical advice. A pharmacist checks every prescription before anything is handed over.</p>
        </footer>
      </body>
    </html>
  );
}

import './globals.css';

export const metadata = {
  title: 'LastMinute Meds',
  description: 'Find which nearby chemist has your medicine, with price, and get it delivered.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="top">
          <a href="/" className="brand">LastMinute Meds</a>
          <a href="/shop" className="link">Shopkeeper</a>
        </header>
        <main>{children}</main>
        <footer className="foot">
          Prototype with invented demo shops. Not medical advice. A pharmacist must check every prescription.
        </footer>
      </body>
    </html>
  );
}

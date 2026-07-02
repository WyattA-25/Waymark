import '../lib/env';
import './globals.css';

export const metadata = {
  title: 'Waymark',
  description: 'Your RV Co-Pilot',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
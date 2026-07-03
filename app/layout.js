import '../lib/env';
import './globals.css';

export const metadata = {
  title: 'Waymark',
  description: 'Your RV Co-Pilot',
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Waymark',
  },
};

export const viewport = {
  themeColor: '#0D1117',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
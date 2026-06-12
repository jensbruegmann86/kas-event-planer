import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Volunteer Planer',
  description: 'Admin Backend fuer Event- und Volunteer-Planung',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}

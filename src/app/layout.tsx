
import type {Metadata, Viewport} from 'next';
import './globals.css';
import { PwaRegister } from '@/components/PwaRegister';
import { Toaster } from '@/components/ui/toaster';
import { NotificationManager } from '@/components/NotificationManager';

export const metadata: Metadata = {
  title: 'TITRATE | MedTech Review',
  description: 'Premium MedTech Board Exam Review App with local-first spaced repetition.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TITRATE',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#0b111a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:wght@400;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <PwaRegister />
        <NotificationManager />
        {children}
        <Toaster />
      </body>
    </html>
  );
}

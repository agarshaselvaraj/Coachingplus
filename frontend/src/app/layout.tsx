import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CoachingPulse | Realtime Athlete & Mindset Feed',
  description: 'Experience real-time athletic strategies, mindset blueprints, and wellness signals directly from elite professional coaches. Powered by Node.js, Next.js, Redis, and WebSockets.',
  keywords: ['coaching', 'mindset', 'strategy', 'athletics', 'realtime feed', 'websockets'],
  authors: [{ name: 'CoachingPulse Inc.' }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}

import { Press_Start_2P } from 'next/font/google';
import type { ReactNode } from 'react';
import Nav from '@/app/components/Nav';
import Footer from '@/app/components/Footer';

const pressStart = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-arcade-display',
  display: 'swap',
});

export default function ArcadeLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Nav />
      <div className={`${pressStart.variable} arcade-zone relative min-h-screen overflow-x-hidden`}>
        <div className="arcade-zone-bg pointer-events-none absolute inset-0" aria-hidden />
        <div className="arcade-scanlines pointer-events-none absolute inset-0" aria-hidden />
        <div className="arcade-vignette pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative z-[1]">{children}</div>
      </div>
      <Footer />
    </>
  );
}

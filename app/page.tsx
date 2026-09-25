import type { Metadata } from 'next';
import Footer from './components/Footer';
import JsonLd from './components/JsonLd';
import HomeBoot from './components/home/HomeBoot';
import HomeHero from './components/home/HomeHero';
import HomeSignal from './components/home/HomeSignal';
import HomeRecords from './components/home/HomeRecords';
import HomeRebirth from './components/home/HomeRebirth';
import HomeApes from './components/home/HomeApes';
import HomeNetwork from './components/home/HomeNetwork';
import HomeCommunity from './components/home/HomeCommunity';
import HomeClose from './components/home/HomeClose';

export const metadata: Metadata = {
  title: 'Turn your volume up',
  description:
    'An on-chain creative network broadcasting from ApeChain. Music, apes, studio, arcade, and the AOA signal.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Turn your volume up',
    description: 'An on-chain creative network broadcasting from ApeChain.',
    url: '/',
  },
  twitter: {
    title: 'Turn your volume up',
    description: 'An on-chain creative network broadcasting from ApeChain.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-clip" style={{ color: 'var(--ink)' }}>
      <JsonLd />
      <HomeBoot />
      <HomeHero />
      <HomeSignal />
      <HomeRecords />
      <HomeRebirth />
      <HomeApes />
      <HomeNetwork />
      <HomeCommunity />
      <HomeClose />
      <Footer />
    </div>
  );
}

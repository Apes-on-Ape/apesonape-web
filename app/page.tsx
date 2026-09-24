import React from 'react';
import Footer from './components/Footer';
import HomeHero from './components/home/HomeHero';
import HomeSignal from './components/home/HomeSignal';
import HomeMusicSection from './components/home/HomeMusicSection';
import HomeApesSection from './components/home/HomeApesSection';
import JsonLd from './components/JsonLd';

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ color: 'var(--foreground)' }}>
      <JsonLd />
      <HomeHero />
      <HomeSignal />
      <HomeMusicSection />
      <HomeApesSection />
      <Footer />
    </div>
  );
}

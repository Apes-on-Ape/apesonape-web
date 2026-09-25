import React from 'react';
import type { Metadata } from 'next';
import Footer from '@/app/components/Footer';
import StoryClient from './StoryClient';

export const metadata: Metadata = {
  title: 'Apes on Ape Story',
  description:
    'From the October 2024 launch on ApeChain, through the December 2024 DMCA and the rebuild, to AOA Records.',
  alternates: { canonical: '/story' },
  openGraph: {
    title: 'Apes on Ape Story',
    description: 'From launch to rebuild, and the station that followed.',
    type: 'article',
    url: '/story',
  },
};

export default function StoryPage() {
  return (
    <div className="min-h-screen" style={{ color: 'var(--foreground)' }}>
      <StoryClient />
      <Footer />
    </div>
  );
}

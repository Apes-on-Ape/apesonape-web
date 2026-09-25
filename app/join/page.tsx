import React from 'react';
import type { Metadata } from 'next';
import Footer from '@/app/components/Footer';
import JoinClient from './JoinClient';

export const metadata: Metadata = {
  title: 'Join the signal',
  description: 'Discord, X, AOA Records, the collection, the studio, and the arcade.',
  alternates: { canonical: '/join' },
  openGraph: {
    title: 'Join the signal — Apes On Ape',
    description: 'Discord, X, AOA Records, the collection, the studio, and the arcade.',
    type: 'website',
  },
};

export default function JoinPage() {
  return (
    <div className="min-h-screen" style={{ color: 'var(--foreground)' }}>
      <JoinClient />
      <Footer />
    </div>
  );
}

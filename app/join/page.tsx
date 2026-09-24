import React from 'react';
import type { Metadata } from 'next';
import Footer from '@/app/components/Footer';
import JoinClient from './JoinClient';

export const metadata: Metadata = {
  title: 'Enter',
  description: "Don't watch. Make it. You can be here before you own anything.",
  openGraph: {
    title: 'Join AOA — Apes On Ape',
    description: "Don't watch the culture. Make it.",
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

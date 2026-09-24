import React from 'react';
import type { Metadata } from 'next';
import Footer from '@/app/components/Footer';
import OpenMicClient from './OpenMicClient';

export const metadata: Metadata = {
  title: 'Open Mic — AOA Records | Apes On Ape',
  description:
    'The AOA Open Mic is for works in progress. Drop your track, get feedback, collaborate with other artists in the Apes On Ape community.',
  openGraph: {
    title: 'Open Mic — AOA Records',
    description: 'Drop your track. Get feedback. Collaborate.',
    type: 'website',
  },
};

export default function OpenMicPage() {
  return (
    <div className="min-h-screen" style={{ color: 'var(--foreground)' }}>
      <OpenMicClient />
      <Footer />
    </div>
  );
}

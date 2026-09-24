import React from 'react';
import type { Metadata } from 'next';
import Footer from '@/app/components/Footer';
import StoryClient from './StoryClient';

export const metadata: Metadata = {
  title: 'Our Story — Apes On Ape',
  description:
    'In December 2024 the art disappeared. The community didn\'t. This is the story of how Apes On Ape went from an NFT collection to a music and culture collective.',
  openGraph: {
    title: 'Our Story — Apes On Ape',
    description: 'The art disappeared. The community didn\'t.',
    type: 'article',
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

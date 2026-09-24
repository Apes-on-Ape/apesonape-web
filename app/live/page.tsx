import type { Metadata } from 'next';
import Footer from '@/app/components/Footer';
import LiveClient from './LiveClient';

export const metadata: Metadata = {
  title: 'Live',
  description: 'What AOA is doing right now.',
  openGraph: {
    title: 'Transmission.',
    description: 'Believe in something.',
  },
};

export default function LivePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <LiveClient />
      <Footer />
    </div>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/app/components/Footer';

export const metadata: Metadata = {
  title: 'WTF is AOA',
  description: 'Started with 10,000 apes. The art disappeared. We rebuilt it. The radio hasn\'t stopped.',
  openGraph: {
    title: 'WTF is AOA',
    description: 'The NFT was just the beginning.',
  },
};

const LINES = [
  'Started with 10,000 apes.',
  'Things got complicated.',
  'The artwork disappeared.',
  'So we rebuilt it.',
  'Most projects would\'ve left.',
  'We didn\'t.',
  'Then we started making music.',
  'A lot of music.',
  'The radio hasn\'t stopped.',
  'Now there are games.',
  'Artists.',
  'Tools.',
  'Characters.',
  'And whatever comes next.',
];

export default function WtfPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <main className="container-premium pt-32 pb-28 max-w-3xl">
        <p className="text-[11px] tracking-[0.35em] uppercase text-white/35">WTF</p>
        <h1 className="mt-4 font-black leading-[0.9] tracking-tight" style={{ fontSize: 'clamp(3rem, 8vw, 6rem)' }}>
          WTF is AOA?
        </h1>
        <ul className="mt-16 space-y-4">
          {LINES.map((line) => (
            <li key={line} className="text-xl md:text-2xl text-white/85">{line}</li>
          ))}
        </ul>
        <p className="mt-16 text-3xl md:text-5xl font-black">The NFT was just the beginning.</p>
        <div className="mt-12 flex flex-wrap gap-8">
          <Link href="/music" className="text-sm font-bold tracking-[0.2em] uppercase border-b border-white pb-1">Listen</Link>
          <Link href="/collection" className="text-sm font-bold tracking-[0.2em] uppercase text-white/45 hover:text-white">See the apes</Link>
        </div>
        <p className="mt-28 text-white/30 text-sm">you&apos;ll figure it out.</p>
      </main>
      <Footer />
    </div>
  );
}

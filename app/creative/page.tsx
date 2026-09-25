'use client';

import Link from 'next/link';
import Footer from '../components/Footer';

const MODULES = [
  { n: '01', title: 'Ape Builder', href: '/creative/ape-builder', text: 'Combine traits from Apes in the connected wallet and export a PNG.' },
  { n: '02', title: 'Banners', href: '/creative/banners', text: 'Build a 1500×500 social banner from a token id. Also available at /banners/.' },
  { n: '03', title: 'PFP Border', href: '/creative/pfp-border', text: 'Add a ring or rounded frame to an image and export a square PNG.' },
  { n: '04', title: 'Meme', href: '/creative/meme', text: 'Place top and bottom text on an image and download a PNG.' },
  { n: '05', title: 'Collage', href: '/creative/collage', text: 'Arrange images in a grid and export one PNG.' },
  { n: '06', title: 'Emotes', href: '/creative/emotes', text: 'Crop an image to a small emote size and export a PNG.' },
  { n: '07', title: 'Stickers', href: '/creative/stickers', text: 'Batch-export images with padding. Transparent PNG is one of the background options.' },
  { n: '08', title: 'QR', href: '/creative/qr', text: 'Make a QR from text or a URL, add a caption, and download a PNG.' },
] as const;

export default function CreativeHubPage() {
  return (
    <div className="min-h-screen text-[var(--ink)]">
      <main className="container-premium pb-[calc(var(--aoa-dock-offset)+2rem)] pt-[calc(var(--aoa-header-h)+1.5rem)]">
        <p className="aoa-meta text-[var(--signal)]">AOA Lab // Creative modules</p>
        <h1 className="type-hero-home mt-4 max-w-[10ch]">AOA Toolbox</h1>
        <p className="mt-4 max-w-xl text-lg">Build something. Send it into the signal.</p>
        <p className="mt-2 max-w-xl text-sm text-[var(--ink-dim)]">These modules export image files. Publishing a record happens in the lab.</p>
        <ul className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {MODULES.map((mod) => (
            <li key={mod.href}>
              <article className="flex h-full min-w-0 flex-col border border-[rgba(243,238,228,0.12)] p-4">
                <p className="aoa-meta text-[var(--signal)]">Module {mod.n}</p>
                <h2 className="mt-3 text-xl font-semibold uppercase tracking-wide">{mod.title}</h2>
                <p className="mt-2 flex-1 text-sm text-[var(--ink-dim)]">{mod.text}</p>
                <Link href={mod.href} className="aoa-home-cta aoa-home-cta-solid mt-4 w-full sm:w-fit">Open module</Link>
              </article>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </div>
  );
}

import Link from 'next/link';
import type { ReactNode } from 'react';
import Footer from '@/app/components/Footer';

export default function ToolChrome({
  index,
  title,
  purpose,
  children,
}: {
  index: string;
  title: string;
  purpose: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen text-[var(--ink)]">
      <main className="container-premium pb-[calc(var(--aoa-dock-offset)+2rem)] pt-[calc(var(--aoa-header-h)+1.5rem)]">
        <p className="aoa-meta text-[var(--signal)]">Module {index}</p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="type-section break-words">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--ink-dim)]">{purpose}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/creative" className="aoa-home-cta aoa-home-cta-ghost">All modules</Link>
            <Link href="/studio/new" className="aoa-home-cta aoa-home-cta-ghost">Open Studio</Link>
          </div>
        </div>
        <div className="aoa-tool-work mt-8">{children}</div>
      </main>
      <Footer />
    </div>
  );
}

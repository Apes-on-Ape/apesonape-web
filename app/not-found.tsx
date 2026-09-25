import Link from 'next/link';

const ROUTES = [
  { href: '/', label: 'Home' },
  { href: '/music', label: 'Radio' },
  { href: '/collection', label: 'Collection' },
  { href: '/studio', label: 'Studio' },
  { href: '/arcade', label: 'Arcade' },
];

export default function NotFound() {
  return (
    <main className="container-premium pb-[calc(var(--aoa-dock-offset)+2rem)] pt-[calc(var(--aoa-header-h)+2rem)] text-[var(--ink)]">
      <p className="aoa-meta">404</p>
      <h1 className="mt-4 font-[family-name:var(--font-signal-display)] text-5xl font-bold uppercase leading-none sm:text-7xl">
        Signal lost.
      </h1>
      <p className="mt-4 text-sm text-[var(--ink-mute)]">Return to the network.</p>
      <ul className="mt-8 flex flex-wrap gap-3">
        {ROUTES.map((route) => (
          <li key={route.href}>
            <Link href={route.href} className="aoa-home-cta aoa-home-cta-ghost">
              {route.label}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

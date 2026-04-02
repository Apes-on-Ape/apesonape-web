import Link from 'next/link';
import { Construction } from 'lucide-react';

export const metadata = {
  title: 'Maintenance — Arcade',
  description: 'Social lounge is temporarily closed.',
};

export default function ClubroomMaintenancePage() {
  return (
    <section className="section-spacing pt-24 md:pt-32">
      <div className="container-premium">
        <div className="arcade-cabinet mx-auto max-w-2xl">
          <div className="arcade-cabinet-inner p-8 text-center sm:p-10">
            <Construction
              className="mx-auto mb-6 h-14 w-14 text-amber-300/90"
              strokeWidth={1.25}
              aria-hidden
            />
            <p className="arcade-subline mb-3">/// MAINTENANCE ///</p>
            <h1 className="arcade-title-pixel text-xl sm:text-2xl md:text-3xl">Social lounge closed</h1>
            <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-[var(--text-sub)] md:text-base">
              This area is offline for maintenance. Access is not available — please use the arcade lobby and games from the hub.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link href="/arcade" className="arcade-btn-neon">
                ← BACK TO ARCADE
              </Link>
              <Link href="/" className="arcade-btn-ghost">
                HOME
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

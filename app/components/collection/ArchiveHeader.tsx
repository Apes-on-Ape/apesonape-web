import BroadcastLabel from '@/app/components/signal/BroadcastLabel';
import NoiseOverlay from '@/app/components/signal/NoiseOverlay';

export default function ArchiveHeader({
  chainId,
  supply,
}: {
  chainId: number;
  supply: string;
}) {
  return (
    <header className="relative mb-8 overflow-hidden border-b border-[rgba(243,238,228,0.12)] pb-8">
      <NoiseOverlay />
      <div className="relative z-10">
        <BroadcastLabel>Signal database</BroadcastLabel>
        <h1 className="type-hero-home mt-4 max-w-[10ch] text-[var(--ink)]">The AOA archive</h1>
        <p className="mt-4 text-lg text-[var(--ink)]">10,000 apes. One signal.</p>
        <p className="aoa-meta mt-6 flex flex-wrap gap-x-4 gap-y-2">
          <span>Network // ApeChain</span>
          <span>Chain // {chainId}</span>
          <span>Supply // {supply}</span>
        </p>
      </div>
    </header>
  );
}

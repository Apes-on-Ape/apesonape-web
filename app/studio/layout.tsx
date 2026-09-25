import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AOA Lab',
  description: 'Visual artifacts created by the AOA network. Create, publish, and open each transmission.',
  alternates: { canonical: '/studio' },
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return children;
}

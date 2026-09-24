import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const title = `Ape #${id}`;
  return {
    title,
    description: 'The original 10,000. AOA.',
    openGraph: {
      title: `${title} — the original 10,000`,
      description: 'Still here. AOA.',
      images: [`https://bqcrbcpmimfojnjdhvrz.supabase.co/storage/v1/object/public/collection/collection-thumbs/${id}.webp`],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} — the original 10,000`,
      description: 'Still here. AOA.',
    },
  };
}

export default function ApeLayout({ children }: { children: React.ReactNode }) {
  return children;
}

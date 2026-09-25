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
    description: `Ape record ${id} in the AOA archive on ApeChain.`,
    alternates: { canonical: `/collection/${id}` },
    openGraph: {
      title: `${title} — AOA archive`,
      description: `Ape record ${id} on ApeChain.`,
      images: [`https://bqcrbcpmimfojnjdhvrz.supabase.co/storage/v1/object/public/collection/collection-thumbs/${id}.webp`],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} — AOA archive`,
      description: `Ape record ${id} on ApeChain.`,
    },
  };
}

export default function ApeLayout({ children }: { children: React.ReactNode }) {
  return children;
}

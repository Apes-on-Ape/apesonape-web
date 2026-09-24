import type { Metadata } from 'next';
import { getArtist } from '@/app/data/artists';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const artist = getArtist(slug);

  if (!artist) {
    return {
      title: 'Artist not found — AOA Records',
    };
  }

  return {
    title: `${artist.name} — AOA Records | Apes On Ape`,
    description: `${artist.bio} — Hear ${artist.name} on AOA Records, the music label of the Apes On Ape community.`,
    openGraph: {
      title: `${artist.name} — AOA Records`,
      description: artist.bio,
      images: artist.avatar ? [{ url: artist.avatar, width: 800, height: 800 }] : [],
      type: 'profile',
    },
    twitter: {
      card: 'summary',
      title: `${artist.name} — AOA Records`,
      description: artist.bio,
    },
  };
}

export default function ArtistLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

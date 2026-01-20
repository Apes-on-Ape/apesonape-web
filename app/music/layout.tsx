import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Music | Apes On Ape",
  description: "Featured albums from Apes On Ape artists on SoundCloud. Discover new tracks from the community.",
  openGraph: {
    title: "Music | Apes On Ape",
    description: "Featured albums from Apes On Ape artists on SoundCloud.",
    images: ["/AoA-placeholder-apecoinblue.jpg"],
  },
};

export default function SoundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}


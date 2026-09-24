import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The original 10,000",
  description: "Before the music. Before the radio. There were 10,000.",
  openGraph: {
    title: "The original 10,000. AOA",
    description: "Before the music. Before the radio. There were 10,000.",
    images: ["/AoA-placeholder-apecoinblue.jpg"],
  },
};

export default function CollectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}


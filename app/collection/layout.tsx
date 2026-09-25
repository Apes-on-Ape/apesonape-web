import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The AOA Archive",
  description: "10,000 Apes on ApeChain. Search the signal database, filter traits, and open each record.",
  alternates: { canonical: "/collection" },
  openGraph: {
    title: "The AOA Archive",
    description: "10,000 Apes on ApeChain. Search, filter, and open each record.",
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


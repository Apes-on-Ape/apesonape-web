import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AOA Records",
  description: "Independent sounds. Community frequencies. Broadcast from ApeChain.",
  openGraph: {
    title: "AOA Records",
    description: "The sound of ApeChain.",
    images: ["/og-image.png"],
  },
};

export default function SoundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}


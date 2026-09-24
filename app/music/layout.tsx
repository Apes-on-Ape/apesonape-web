import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Turn your volume up",
  description: "This community built a record label. Apes together strong.",
  openGraph: {
    title: "Turn your volume up",
    description: "Apes together strong.",
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


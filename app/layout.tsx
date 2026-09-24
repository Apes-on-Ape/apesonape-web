import type { Metadata } from "next";
import { Barlow_Condensed, IBM_Plex_Mono, Raleway } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./components/ThemeProvider";
import GlyphClientProvider from "./components/GlyphClientProvider";
import GlyphArcadeWalletSync from "./components/GlyphArcadeWalletSync";
import NotificationToast from "./components/NotificationToast";
import ApeBackground from "./components/ApeBackground";
import PWAManager from "./components/PWAManager";
import ClientOnlyGlobals from "./components/ClientOnlyGlobals";
import Nav from "./components/Nav";

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const signalDisplay = Barlow_Condensed({
  variable: "--font-signal-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["600", "700", "800", "900"],
});

const signalMono = IBM_Plex_Mono({
  variable: "--font-signal-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  // Ensure absolute URLs for OG/Twitter images
  metadataBase: new URL('https://apesonape.io'),
  title: {
    default: 'Apes on Ape — AOA',
    template: '%s | Apes On Ape',
  },
  description:
    '10,000 apes started something. Music, radio, games, art and whatever comes next.',
  keywords: ['AOA', 'Apes On Ape', 'AOA Records', 'Music'],
  authors: [{ name: 'Apes On Ape' }],
  openGraph: {
    title: 'Still here. AOA',
    description: 'Believe in something. Apes together strong.',
    url: 'https://apesonape.io',
    siteName: 'Apes On Ape',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Apes On Ape — Music, Art & Culture',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Still here. AOA',
    description: 'Believe in something.',
    images: ['/og-image.png'],
    creator: '@apesonape',
    site: '@apesonape',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="AoA Music" />
        <link rel="icon" href="/favicon.png" type="image/png" sizes="any" />
        <link rel="icon" href="/icons/favicon-32.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
        {/* Speed up first connections to IPFS gateways used in collection */}
        <link rel="preconnect" href="https://moccasin-brilliant-silkworm-382.mypinata.cloud" crossOrigin="" />
        <link rel="dns-prefetch" href="https://moccasin-brilliant-silkworm-382.mypinata.cloud" />
        <link rel="preconnect" href="https://gateway.pinata.cloud" crossOrigin="" />
        <link rel="dns-prefetch" href="https://gateway.pinata.cloud" />
        <link rel="preconnect" href="https://cloudflare-ipfs.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://cloudflare-ipfs.com" />
        <link rel="preconnect" href="https://ipfs.io" crossOrigin="" />
        <link rel="dns-prefetch" href="https://ipfs.io" />
        <link rel="preconnect" href="https://nftstorage.link" crossOrigin="" />
        <link rel="dns-prefetch" href="https://nftstorage.link" />
        <link rel="preconnect" href="https://dweb.link" crossOrigin="" />
        <link rel="dns-prefetch" href="https://dweb.link" />
      </head>
      <body
        className={`${raleway.variable} ${signalDisplay.variable} ${signalMono.variable} antialiased font-sans`}
      >
        {/* Root stacking context — ApeBackground at z:-1 renders behind all page content */}
        <div style={{ position: 'relative', zIndex: 0 }}>
          <ApeBackground />
          <ThemeProvider>
            <GlyphClientProvider>
              <GlyphArcadeWalletSync />
              <Nav />
              <div id="aoa-main" className="min-h-screen">
                {children}
              </div>
              <NotificationToast />
            </GlyphClientProvider>
            <ClientOnlyGlobals />
            <PWAManager />
          </ThemeProvider>
        </div>
      </body>
    </html>
  );
}

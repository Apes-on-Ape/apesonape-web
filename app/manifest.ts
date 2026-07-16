import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Apes On Ape',
    short_name: 'AoA Music',
    description: 'Music made by Ape holders — AOA Records',
    start_url: '/music',
    scope: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#1d4ed8',
    orientation: 'portrait-primary',
    categories: ['music', 'entertainment'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    screenshots: [
      {
        src: '/AoA-placeholder-apecoinblue.jpg',
        sizes: '1200x630',
        type: 'image/jpeg',
        form_factor: 'wide',
        label: 'AOA Records Music Player',
      },
    ],
  };
}

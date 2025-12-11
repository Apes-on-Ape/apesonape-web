import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gateway.pinata.cloud',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'moccasin-brilliant-silkworm-382.mypinata.cloud',
      },
      {
        protocol: 'https',
        hostname: 'cloudflare-ipfs.com',
      },
      {
        protocol: 'https',
        hostname: 'ipfs.io',
      },
      {
        protocol: 'https',
        hostname: 'nftstorage.link',
      },
      {
        protocol: 'https',
        hostname: 'dweb.link',
      },
      {
        protocol: 'https',
        hostname: '**.magiceden.dev',
      },
      {
        protocol: 'https',
        hostname: '**.magiceden.us',
      },
      {
        protocol: 'https',
        hostname: '**.sndcdn.com',
      },
      {
        protocol: 'https',
        hostname: 'drive.google.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
    ],
  },
  trailingSlash: true,
  reactStrictMode: true,
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  // Environment variables that are safe to expose to the browser
  env: {
    NEXT_PUBLIC_ME_COLLECTION: process.env.NEXT_PUBLIC_ME_COLLECTION || '0xa6bAbE18F2318D2880DD7dA3126C19536048F8B0',
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://apesonape.io',
    NEXT_PUBLIC_APECHAIN_RPC: process.env.NEXT_PUBLIC_APECHAIN_RPC || 'https://rpc.apechain.com/http',
    // Hardcoded per request (was env-driven)
    NEXT_PUBLIC_GLYPH_PRIVY_APP_ID: 'cmit1t84p00nllb0c3yzjz8d8',
    NEXT_PUBLIC_GLYPH_APP_ID: 'cly38x0w10ac945q9yg9sm71i',
    NEXT_PUBLIC_APECHAIN_CHAIN_ID: '33139',
  },
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@react-native-async-storage/async-storage': require.resolve('./shims/empty.js'),
      '@solana-program/system': require.resolve('./shims/solana-system.js'),
      '@solana-program/token': require.resolve('./shims/solana-token.js'),
      '@solana-program/token-2022': require.resolve('./shims/solana-token.js'),
      // Prevent bundling optional test deps referenced in thread-stream tests/benches
      tap: require.resolve('./shims/empty.js'),
      tape: require.resolve('./shims/empty.js'),
      'why-is-node-running': require.resolve('./shims/empty.js'),
      desm: require.resolve('./shims/empty.js'),
      'fastbench': require.resolve('./shims/empty.js'),
      'pino-elasticsearch': require.resolve('./shims/empty.js'),
      'thread-stream/test': require.resolve('./shims/empty.js'),
      'thread-stream/bench.js': require.resolve('./shims/empty.js'),
      '@reown/appkit-controllers/node_modules/thread-stream/test': require.resolve('./shims/empty.js'),
      '@reown/appkit-controllers/node_modules/thread-stream/bench.js': require.resolve('./shims/empty.js'),
      '@reown/appkit-utils/node_modules/thread-stream/test': require.resolve('./shims/empty.js'),
      '@reown/appkit-utils/node_modules/thread-stream/bench.js': require.resolve('./shims/empty.js'),
      '@reown/appkit/node_modules/thread-stream/test': require.resolve('./shims/empty.js'),
      '@reown/appkit/node_modules/thread-stream/bench.js': require.resolve('./shims/empty.js'),
      '/ROOT/node_modules/thread-stream/test/create-and-exit.js': require.resolve('./shims/empty.js'),
      '/ROOT/node_modules/thread-stream/test/close-on-gc.js': require.resolve('./shims/empty.js'),
      '/ROOT/node_modules/@reown/appkit-controllers/node_modules/thread-stream/test/create-and-exit.js': require.resolve('./shims/empty.js'),
      '/ROOT/node_modules/@reown/appkit-controllers/node_modules/thread-stream/test/close-on-gc.js': require.resolve('./shims/empty.js'),
      '/ROOT/node_modules/@reown/appkit-utils/node_modules/thread-stream/test/create-and-exit.js': require.resolve('./shims/empty.js'),
      '/ROOT/node_modules/@reown/appkit-utils/node_modules/thread-stream/test/close-on-gc.js': require.resolve('./shims/empty.js'),
      '/ROOT/node_modules/@reown/appkit/node_modules/thread-stream/test/create-and-exit.js': require.resolve('./shims/empty.js'),
      '/ROOT/node_modules/@reown/appkit/node_modules/thread-stream/test/close-on-gc.js': require.resolve('./shims/empty.js'),
    };
    return config;
  },
};

export default nextConfig;

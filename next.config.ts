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
  // All values are hardcoded - no need for .env variables
  env: {
    NEXT_PUBLIC_ME_COLLECTION: '0xa6bAbE18F2318D2880DD7dA3126C19536048F8B0',
    NEXT_PUBLIC_SITE_URL: 'https://apesonape.io',
    NEXT_PUBLIC_APECHAIN_RPC: 'https://rpc.apechain.com/http',
    NEXT_PUBLIC_GLYPH_PRIVY_APP_ID: 'cmit1t84p00nllb0c3yzjz8d8',
    NEXT_PUBLIC_GLYPH_APP_ID: 'cly38x0w10ac945q9yg9sm71i',
    NEXT_PUBLIC_APECHAIN_CHAIN_ID: '33139',
    NEXT_PUBLIC_SUPABASE_URL: 'https://bqcrbcpmimfojnjdhvrz.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxY3JiY3BtaW1mb2puamRodnJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MjE1ODEsImV4cCI6MjA4MDI5NzU4MX0.tlDiLyCdrOAULzLH9fv0rm5wpiHqy4nzDvmpC9xXRGw',
  },
  webpack: (config, { isServer }) => {
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

    // CRITICAL: Prevent service role key from being bundled into client code
    // Only replace process.env variables that start with NEXT_PUBLIC_ in client bundles
    if (!isServer && config.plugins) {
      const DefinePlugin = require('webpack').DefinePlugin;
      const existingDefinePlugin = config.plugins.find(
        (plugin: any) => plugin instanceof DefinePlugin
      );
      
      if (existingDefinePlugin) {
        // Remove service role keys from DefinePlugin replacements in client bundles
        const definitions = existingDefinePlugin.definitions || {};
        delete definitions['process.env.SUPABASE_SERVICE_ROLE_KEY'];
        delete definitions['process.env.SERVICE_ROLE_KEY'];
      }
    }

    return config;
  },
};

export default nextConfig;

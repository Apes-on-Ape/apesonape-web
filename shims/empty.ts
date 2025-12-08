// Empty shim for optional/test-only modules pulled in by dependencies.
export const noop = () => {};

// Common test helpers requested by tap/tape consumers.
export const test = (..._args: any[]) => noop();

// Minimal path helper some test fixtures import from `desm`.
export const join = (...args: any[]) => args.map(String).join('/');

// Minimal named exports some libs expect from Privy.
export const usePrivy = () => ({ user: null, authenticated: false, ready: false });
export const PrivyProvider = ({ children }: { children: any }) => children as any;

// Minimal named exports some libs expect from wagmi (privy wrapper).
export const createConfig = (..._args: any[]) => ({});
export const WagmiProvider = ({ children }: { children: any }) => children as any;
export const useConfig = () => ({});

// Default export for consumers expecting a default object.
export default {
  noop,
  test,
  join,
  usePrivy,
  PrivyProvider,
  createConfig,
  WagmiProvider,
  useConfig,
};


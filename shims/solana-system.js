// Minimal browser shim for @solana-program/system
// Provides the expected export but will throw if invoked.
export function getTransferSolInstruction() {
  throw new Error('Solana transfer is not supported in this web build.');
}

export default {};


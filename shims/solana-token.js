// Minimal shim for @solana-program/token and token-2022 in browser builds.
export const TOKEN_PROGRAM_ADDRESS = 'TokenProgramUnsupportedInWebShim';
export const TOKEN_2022_PROGRAM_ADDRESS = 'Token2022ProgramUnsupportedInWebShim';

export function findAssociatedTokenPda() {
  throw new Error('findAssociatedTokenPda is not supported in this web build.');
}

export function getCreateAssociatedTokenIdempotentInstruction() {
  throw new Error('getCreateAssociatedTokenIdempotentInstruction is not supported in this web build.');
}

export function getCreateAssociatedTokenInstructionAsync() {
  throw new Error('getCreateAssociatedTokenInstructionAsync is not supported in this web build.');
}

export function getTransferInstruction() {
  throw new Error('getTransferInstruction is not supported in this web build.');
}

export function fetchMint() {
  throw new Error('fetchMint is not supported in this web build.');
}

export function getTransferCheckedInstruction() {
  throw new Error('getTransferCheckedInstruction is not supported in this web build.');
}

export function fetchToken() {
  throw new Error('fetchToken is not supported in this web build.');
}

export default {};


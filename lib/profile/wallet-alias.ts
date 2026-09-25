const EVM = /^0x[a-f0-9]{40}$/;

export function normalizeAliasWallet(value: string) {
	return value.trim().toLowerCase();
}

export function isEvmAddress(value: string) {
	return EVM.test(value);
}

/** Trimmed display name, or an error string. */
export function parseWalletAlias(value: unknown): { alias: string } | { error: string } {
	if (typeof value !== 'string') return { error: 'Enter a wallet name.' };
	const alias = value.trim();
	if (!alias) return { error: 'Enter a wallet name.' };
	if (alias.length > 32) return { error: 'Wallet names can be up to 32 characters.' };
	if (/[<>]/.test(alias) || /[\u0000-\u001F\u007F]/.test(alias)) {
		return { error: 'That wallet name is not allowed.' };
	}
	return { alias };
}

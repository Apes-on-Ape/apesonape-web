import 'server-only';
import { ME_COLLECTION_ADDRESS, APECHAIN_RPC } from '../constants';

const ME_API_BASE = 'https://api-mainnet.magiceden.dev/v2';

function toChecksumAddress(addr: string) {
	return addr.toLowerCase();
}

async function verifyViaMagicEden(address: string, apeTokenId: number): Promise<boolean> {
	const wallet = toChecksumAddress(address);
	const contract = toChecksumAddress(ME_COLLECTION_ADDRESS);
	const limit = 200;
	for (let offset = 0; offset < 1000; offset += limit) {
		const url = `${ME_API_BASE}/wallets/${wallet}/tokens?limit=${limit}&offset=${offset}`;
		let data: any;
		try {
			const resp = await fetch(url, { headers: { accept: 'application/json' } });
			if (!resp.ok) break;
			data = await resp.json();
		} catch {
			break;
		}
		const tokens = Array.isArray(data?.tokens) ? data.tokens : Array.isArray(data) ? data : [];
		if (tokens.length === 0) break;
		const match = tokens.some((token: any) => {
			const tokenId = Number.parseInt(String(token?.tokenId ?? token?.token_id ?? token?.id ?? ''), 10);
			const contractAddr = String(token?.collectionAddress ?? token?.collection_address ?? token?.contractAddress ?? token?.contract ?? '').toLowerCase();
			const collectionAddr = contractAddr || String(token?.collection ?? token?.collectionSymbol ?? token?.collectionName ?? '').toLowerCase();
			const sameCollection = collectionAddr === contract;
			const idMatch = tokenId === apeTokenId;
			return sameCollection && idMatch;
		});
		if (match) return true;
		if (tokens.length < limit) break;
	}
	return false;
}

export async function verifyApeOwnership(address: string, apeId: number): Promise<boolean> {
	if (!address || apeId < 0) return false;
	const contract = ME_COLLECTION_ADDRESS;
	const rpcUrl = APECHAIN_RPC;
	if (!contract || !rpcUrl) return false;

	const selector = '0x6352211e'; // ownerOf(uint256)
	const tokenIdHex = BigInt(apeId).toString(16).padStart(64, '0');
	const data = `${selector}${tokenIdHex}`;

	type RpcResponse = { jsonrpc: string; id: number; result?: string; error?: { code: number; message: string } };
	const body = {
		jsonrpc: '2.0',
		id: Math.floor(Math.random() * 1_000_000),
		method: 'eth_call',
		params: [
			{ to: contract, data },
			'latest',
		],
	};

	let res: RpcResponse;
	try {
		const resp = await fetch(rpcUrl, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(body),
		});
		res = (await resp.json()) as RpcResponse;
	} catch {
		res = {} as RpcResponse;
	}
	if (!res.result || res.result === '0x') {
		return verifyViaMagicEden(address, apeId);
	}

	// result is 32-byte left-padded address
	const ownerHex = `0x${res.result.slice(-40)}`;
	const onchainMatch = toChecksumAddress(ownerHex) === toChecksumAddress(address);
	if (onchainMatch) return true;
	return verifyViaMagicEden(address, apeId);
}

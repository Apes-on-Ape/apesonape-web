import { createPublicKey, verify as verifySignature } from 'crypto';

const APP_ID = 'cmit1t84p00nllb0c3yzjz8d8';
const JWKS_URL = `https://auth.privy.io/api/v1/apps/${APP_ID}/jwks.json`;

type Jwk = { kid?: string; kty?: string; crv?: string; x?: string; y?: string };
type TokenPayload = { sub?: string; iss?: string; aud?: string | string[]; exp?: number };

let cachedKeys: { keys: Jwk[]; fetchedAt: number } | null = null;

function decodePart(part: string) {
	const pad = part.length % 4 === 0 ? '' : '='.repeat(4 - (part.length % 4));
	return Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

async function signingKeys(): Promise<Jwk[]> {
	if (cachedKeys && Date.now() - cachedKeys.fetchedAt < 10 * 60 * 1000) return cachedKeys.keys;
	const response = await fetch(JWKS_URL, { cache: 'no-store' });
	if (!response.ok) throw new Error('Could not verify this session.');
	const json = (await response.json()) as { keys?: Jwk[] };
	const keys = json.keys ?? [];
	cachedKeys = { keys, fetchedAt: Date.now() };
	return keys;
}

/** Verifies a Privy user access token. Returns the Privy user id (`sub`). */
export async function verifyPrivyUserId(authorization: string | null): Promise<string> {
	const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
	const parts = token.split('.');
	if (parts.length !== 3) throw new Error('Sign in again to name this wallet.');

	const header = JSON.parse(decodePart(parts[0]).toString('utf8')) as { kid?: string; alg?: string };
	const payload = JSON.parse(decodePart(parts[1]).toString('utf8')) as TokenPayload;
	if (header.alg !== 'ES256') throw new Error('Sign in again to name this wallet.');
	if (payload.iss !== 'privy.io') throw new Error('Sign in again to name this wallet.');
	const audience = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
	if (!audience.includes(APP_ID)) throw new Error('Sign in again to name this wallet.');
	if (!payload.exp || payload.exp * 1000 < Date.now()) throw new Error('Sign in again to name this wallet.');
	const userId = typeof payload.sub === 'string' ? payload.sub.trim() : '';
	if (!userId) throw new Error('Sign in again to name this wallet.');

	const keys = await signingKeys();
	const jwk = keys.find((key) => key.kid === header.kid) ?? keys.find((key) => key.kty === 'EC');
	if (!jwk) throw new Error('Sign in again to name this wallet.');
	const key = createPublicKey({ key: jwk as never, format: 'jwk' });
	const signature = decodePart(parts[2]);
	const valid = verifySignature(
		'sha256',
		Buffer.from(`${parts[0]}.${parts[1]}`),
		{ key, dsaEncoding: 'ieee-p1363' },
		signature,
	);
	if (!valid) throw new Error('Sign in again to name this wallet.');
	return userId;
}

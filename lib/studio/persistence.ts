import 'server-only';
import fs from 'fs/promises';
import path from 'path';
import { CreationRecord, CreationType } from './types';
import { getSupabaseServiceClient } from '../supabase';

const DATA_PATH = path.join(process.cwd(), 'data', 'studio-creations.json');
const CACHE_TTL_MS = 45 * 1000;

type ListOptions = {
	limit?: number;
	cursor?: string | null;
	type?: CreationType | 'all';
	search?: string | null;
	creator?: string | null;
};

type ListResult = {
	items: CreationRecord[];
	nextCursor?: string | null;
};

type ApeUseRecord = {
	apeId: number;
	usedBy: string;
	creationId?: string | null;
};

type CacheEntry = {
	key: string;
	data: ListResult;
	at: number;
};

const feedCache = new Map<string, CacheEntry>();

// -------- Local JSON fallback --------
async function ensureStore() {
	const dir = path.dirname(DATA_PATH);
	await fs.mkdir(dir, { recursive: true });
	try {
		await fs.access(DATA_PATH);
	} catch {
		await fs.writeFile(DATA_PATH, JSON.stringify({ creations: [] }, null, 2), 'utf8');
	}
}

async function readStore(): Promise<CreationRecord[]> {
	await ensureStore();
	const raw = await fs.readFile(DATA_PATH, 'utf8');
	try {
		const parsed = JSON.parse(raw) as { creations?: CreationRecord[] };
		return parsed.creations || [];
	} catch {
		return [];
	}
}

async function writeStore(creations: CreationRecord[]) {
	await ensureStore();
	await fs.writeFile(DATA_PATH, JSON.stringify({ creations }, null, 2), 'utf8');
	feedCache.clear();
}

function makeCursor(item: CreationRecord) {
	return Buffer.from(`${item.createdAt}|${item.id}`, 'utf8').toString('base64');
}

function parseCursor(cursor: string | null | undefined) {
	if (!cursor) return null;
	try {
		const decoded = Buffer.from(cursor, 'base64').toString('utf8');
		const [createdAt, id] = decoded.split('|');
		return { createdAt, id };
	} catch {
		return null;
	}
}

/** Same file saved more than once (a failed publish retried) should appear once. Newest row wins. */
function dedupeCreations(items: CreationRecord[]): CreationRecord[] {
	const seen = new Set<string>();
	const unique: CreationRecord[] = [];
	for (const item of items) {
		const key = (item.artifactUrl || item.id).trim();
		if (seen.has(key)) continue;
		seen.add(key);
		unique.push(item);
	}
	return unique;
}

// -------- Supabase provider (optional) --------
function supabaseClient() {
	const svc = getSupabaseServiceClient();
	if (!svc) {
		// In preview environments, throw a more user-friendly error
		if (process.env.NETLIFY || process.env.VERCEL_URL || process.env.CONTEXT === 'deploy-preview') {
			throw new Error('Studio features are not available in preview deployments. Please deploy to production or set up Supabase environment variables.');
		}
		throw new Error('Supabase is not configured; studio persistence requires DB (no local fallback).');
	}
	return svc;
}

function isStudioDbAvailable(): boolean {
	return getSupabaseServiceClient() !== null;
}

/** Read-only listing from data/studio-creations.json when service role is unset (local dev). */
async function localListCreations(options: ListOptions): Promise<ListResult> {
	const limit = Math.min(Math.max(options.limit || 20, 1), 50);
	let items = await readStore();
	if (options.type && options.type !== 'all') {
		items = items.filter((c) => c.type === options.type);
	}
	if (options.creator) {
		const c = options.creator.toLowerCase();
		items = items.filter(
			(row) =>
				row.creatorAddress.toLowerCase().includes(c) ||
				(row.glyphProfile?.xHandle && row.glyphProfile.xHandle.toLowerCase().includes(c)),
		);
	}
	if (options.search) {
		const term = options.search.toLowerCase();
		items = items.filter(
			(row) =>
				row.title.toLowerCase().includes(term) ||
				(row.description || '').toLowerCase().includes(term) ||
				row.creatorAddress.toLowerCase().includes(term) ||
				(row.glyphProfile?.xHandle && row.glyphProfile.xHandle.toLowerCase().includes(term)),
		);
	}
	items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
	const page = dedupeCreations(items).slice(0, limit);
	return { items: page, nextCursor: null };
}

async function localGet(id: string): Promise<CreationRecord | null> {
	const creations = await readStore();
	return creations.find((c) => c.id === id) ?? null;
}

async function dbCreate(record: CreationRecord): Promise<CreationRecord> {
	const svc = supabaseClient();
	const payload = {
		id: record.id,
		creator_address: record.creatorAddress,
		user_id: record.glyphProfile?.glyphId || null,
		type: record.type,
		title: record.title,
		description: record.description,
		tags: record.tags || [],
		artifact: record.artifact,
		artifact_url: record.artifactUrl,
		metadata_url: record.metadataUrl,
		content_hash: record.contentHash,
		code_preview: record.codePreview,
		glyph_profile: record.glyphProfile || null,
		created_at: record.createdAt,
	};
	const { error } = await svc.from('studio_creations').insert(payload);
	if (error) throw new Error(error.message);
	return record;
}

async function dbGet(id: string): Promise<CreationRecord | null> {
	const svc = supabaseClient();
	const { data, error } = await svc.from('studio_creations').select('*').eq('id', id).limit(1).maybeSingle();
	if (error) return null;
	if (!data) return null;
	return normalizeDbRecord(data);
}

function normalizeDbRecord(row: any): CreationRecord {
	return {
		id: row.id,
		creatorAddress: row.creator_address,
		glyphProfile: row.glyph_profile || undefined,
		type: row.type,
		title: row.title,
		description: row.description,
		tags: row.tags || [],
		artifact: row.artifact,
		metadataUrl: row.metadata_url,
		contentHash: row.content_hash,
		artifactUrl: row.artifact_url,
		codePreview: row.code_preview,
		createdAt: row.created_at,
	};
}

async function dbList(options: ListOptions): Promise<ListResult> {
	const svc = supabaseClient();
	const limit = Math.min(Math.max(options.limit || 20, 1), 50);
	let query = svc.from('studio_creations').select('*').order('created_at', { ascending: false }).limit(limit);
	if (options.cursor) {
		// cursor pagination not implemented for Supabase; rely on limit for now
	}
	if (options.type && options.type !== 'all') {
		query = query.eq('type', options.type);
	}
	if (options.creator) {
		const c = options.creator.toLowerCase();
		query = query.or(`creator_address.ilike.${c},glyph_profile->>xHandle.ilike.${c}`);
	}
	if (options.search) {
		const term = `%${options.search.toLowerCase()}%`;
		query = query.or(
			`title.ilike.${term},description.ilike.${term},creator_address.ilike.${term},glyph_profile->>xHandle.ilike.${term}`,
		);
	}
	const { data, error } = await query;
	if (error) throw new Error(error.message);
	const items = (data || []).map(normalizeDbRecord);
	return { items: dedupeCreations(items), nextCursor: null };
}

async function dbDelete(id: string): Promise<boolean> {
	const svc = supabaseClient();
	const { error, data } = await svc.from('studio_creations').delete().eq('id', id).select('id');
	if (error) throw new Error(error.message);
	return data && data.length > 0;
}

async function dbReserveApeUse(record: ApeUseRecord): Promise<void> {
	const svc = supabaseClient();
	const payload = {
		ape_id: record.apeId,
		used_by: record.usedBy,
		creation_id: record.creationId || null,
	};
	const { error } = await svc.from('studio_ape_uses').insert(payload);
	if (error) {
		if ((error as { code?: string }).code === '23505') {
			throw new Error('Ape already used');
		}
		throw new Error(error.message);
	}
}

async function dbReleaseApeUse(apeId: number, usedBy?: string) {
	const svc = supabaseClient();
	let query = svc.from('studio_ape_uses').delete().eq('ape_id', apeId);
	if (usedBy) query = query.eq('used_by', usedBy);
	await query;
}

// -------- Public API with fallback --------
export async function createCreation(record: CreationRecord): Promise<CreationRecord> {
	return dbCreate(record);
}

/** Creations this Ape published since UTC midnight, including rows saved before user_id existed. */
export async function countTransmissionsToday(userId: string, wallets: string[]): Promise<number> {
	const svc = supabaseClient();
	const since = new Date();
	since.setUTCHours(0, 0, 0, 0);
	const sinceIso = since.toISOString();
	const ids = new Set<string>();

	const byUser = await svc.from('studio_creations').select('id').gte('created_at', sinceIso).eq('user_id', userId);
	if (byUser.error) throw new Error(byUser.error.message);
	for (const row of byUser.data ?? []) ids.add(String(row.id));

	const byGlyph = await svc.from('studio_creations').select('id').gte('created_at', sinceIso).eq('glyph_profile->>glyphId', userId);
	if (byGlyph.error) throw new Error(byGlyph.error.message);
	for (const row of byGlyph.data ?? []) ids.add(String(row.id));

	const addresses = [...new Set(wallets.map((wallet) => wallet.toLowerCase()).filter(Boolean))];
	if (addresses.length) {
		const byWallet = await svc.from('studio_creations').select('id').gte('created_at', sinceIso).in('creator_address', addresses);
		if (byWallet.error) throw new Error(byWallet.error.message);
		for (const row of byWallet.data ?? []) ids.add(String(row.id));
	}

	return ids.size;
}

export async function getCreation(id: string): Promise<CreationRecord | null> {
	if (!isStudioDbAvailable()) {
		return localGet(id);
	}
	return dbGet(id);
}

export async function deleteCreation(id: string): Promise<boolean> {
	return dbDelete(id);
}

export async function listCreations(options: ListOptions = {}): Promise<ListResult> {
	if (!isStudioDbAvailable()) {
		return localListCreations(options);
	}
	return dbList(options);
}

export async function reserveApeUse(apeId: number, usedBy: string, creationId?: string) {
	return dbReserveApeUse({ apeId, usedBy, creationId });
}

export async function releaseApeUse(apeId: number, usedBy?: string) {
	return dbReleaseApeUse(apeId, usedBy);
}


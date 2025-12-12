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

// -------- Supabase provider (optional) --------
function supabaseClient() {
	const svc = getSupabaseServiceClient();
	if (!svc) {
		throw new Error('Supabase is not configured; studio persistence requires DB (no local fallback).');
	}
	return svc;
}

async function dbCreate(record: CreationRecord): Promise<CreationRecord> {
	const svc = supabaseClient();
	const payload = {
		id: record.id,
		creator_address: record.creatorAddress,
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
	return { items, nextCursor: null };
}

async function dbDelete(id: string): Promise<boolean> {
	const svc = supabaseClient();
	const { error, data } = await svc.from('studio_creations').delete().eq('id', id).select('id');
	if (error) throw new Error(error.message);
	return data && data.length > 0;
}

// -------- Public API with fallback --------
export async function createCreation(record: CreationRecord): Promise<CreationRecord> {
	return dbCreate(record);
}

export async function getCreation(id: string): Promise<CreationRecord | null> {
	return dbGet(id);
}

export async function deleteCreation(id: string): Promise<boolean> {
	return dbDelete(id);
}

export async function listCreations(options: ListOptions = {}): Promise<ListResult> {
	return dbList(options);
}


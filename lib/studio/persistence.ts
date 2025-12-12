import fs from 'fs/promises';
import path from 'path';
import { CreationRecord, CreationType } from './types';

const DATA_PATH = path.join(process.cwd(), 'data', 'studio-creations.json');
const CACHE_TTL_MS = 45 * 1000;

type ListOptions = {
	limit?: number;
	cursor?: string | null;
	type?: CreationType | 'all';
	search?: string | null;
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

export async function createCreation(record: CreationRecord): Promise<CreationRecord> {
	const creations = await readStore();
	creations.push(record);
	await writeStore(creations);
	return record;
}

export async function getCreation(id: string): Promise<CreationRecord | null> {
	const creations = await readStore();
	return creations.find((c) => c.id === id) || null;
}

export async function listCreations(options: ListOptions = {}): Promise<ListResult> {
	const key = JSON.stringify({
		limit: options.limit || 20,
		cursor: options.cursor || '',
		type: options.type || 'all',
		search: options.search?.toLowerCase() || '',
	});
	const cached = feedCache.get(key);
	const now = Date.now();
	if (cached && now - cached.at < CACHE_TTL_MS) return cached.data;

	const limit = Math.min(Math.max(options.limit || 20, 1), 50);
	const cursor = parseCursor(options.cursor);
	const type = (options.type || 'all') as CreationType | 'all';
	const search = options.search?.toLowerCase()?.trim() || '';

	const creations = await readStore();
	const filtered = creations
		.filter((c) => (type === 'all' ? true : c.type === type))
		.filter((c) => {
			if (!search) return true;
			const haystack = [
				c.title || '',
				c.description || '',
				c.creatorAddress || '',
				c.glyphProfile?.xHandle || '',
			]
				.join(' ')
				.toLowerCase();
			return haystack.includes(search);
		})
		.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

	let startIndex = 0;
	if (cursor) {
		startIndex = filtered.findIndex(
			(c) => c.id === cursor.id || c.createdAt === cursor.createdAt,
		);
		if (startIndex >= 0) startIndex += 1;
	}

	const sliced = filtered.slice(startIndex, startIndex + limit);
	const nextCursor = sliced.length === limit ? makeCursor(sliced[sliced.length - 1]) : null;

	const result: ListResult = { items: sliced, nextCursor };
	feedCache.set(key, { key, data: result, at: now });
	return result;
}


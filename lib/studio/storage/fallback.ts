import fs from 'fs/promises';
import path from 'path';
import { ArtifactInfo } from '../types';

type UploadArgs = {
	file?: File | Blob;
	text?: string;
	filename?: string;
	mime?: string;
};

const PUBLIC_BASE = process.env.STUDIO_PUBLIC_BASE || process.env.NEXT_PUBLIC_SITE_URL || '';
const STORAGE_DIR = path.join(process.cwd(), 'public', 'studio');

async function ensureDir() {
	await fs.mkdir(STORAGE_DIR, { recursive: true });
}

function randomName(ext: string) {
	const safeExt = ext.replace(/[^a-zA-Z0-9]/g, '') || 'bin';
	return `${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`;
}

async function writeFileToDisk(buffer: Buffer, filename: string) {
	await ensureDir();
	const target = path.join(STORAGE_DIR, filename);
	await fs.writeFile(target, buffer);
	const publicPath = `/studio/${filename}`;
	if (!PUBLIC_BASE) return publicPath;
	const base = PUBLIC_BASE.endsWith('/') ? PUBLIC_BASE.slice(0, -1) : PUBLIC_BASE;
	return `${base}${publicPath}`;
}

export async function uploadArtifactFallback(args: UploadArgs): Promise<ArtifactInfo> {
	if (args.text) {
		const buf = Buffer.from(args.text, 'utf8');
		const filename = args.filename || randomName('txt');
		const uri = await writeFileToDisk(buf, filename);
		return {
			uri,
			mime: args.mime || 'text/plain',
			size: buf.byteLength,
			text: args.text,
		};
	}

	const file = args.file;
	if (!file) {
		throw new Error('Missing artifact');
	}
	const arrayBuffer = await file.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);
	const inferredExt = (file as File).name?.split('.').pop() || '';
	const filename = args.filename || randomName(inferredExt || 'bin');
	const uri = await writeFileToDisk(buffer, filename);
	return {
		uri,
		mime: args.mime || file.type || 'application/octet-stream',
		size: buffer.byteLength,
	};
}

export async function uploadMetadataFallback(metadataJson: string): Promise<{ uri: string }> {
	const buffer = Buffer.from(metadataJson, 'utf8');
	const filename = randomName('json');
	const uri = await writeFileToDisk(buffer, filename);
	return { uri };
}


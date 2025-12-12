'use server';

import { NextRequest, NextResponse } from 'next/server';
import { uploadArtifact, uploadMetadata } from '@/lib/studio/storage';
import { createCreation, listCreations } from '@/lib/studio/persistence';
import { CreationRecord, CreationType, GlyphProfile } from '@/lib/studio/types';
import { addExperience } from '@/lib/studio/xp';

const TITLE_LIMIT = 80;
const DESCRIPTION_LIMIT = 280;
const TAG_LIMIT = 5;
const MAX_FILE_MB = Number(process.env.STUDIO_MAX_FILE_MB || '20');
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

const ALLOWED_TYPES: CreationType[] = ['sound', 'visual', 'interactive', 'code'];

function cleanText(value: string, max: number) {
	return value.replace(/\s+/g, ' ').replace(/[<>]/g, '').trim().slice(0, max);
}

function parseTags(raw: unknown): string[] {
	if (!raw) return [];
	try {
		if (typeof raw === 'string') {
			const parsed = JSON.parse(raw);
			if (Array.isArray(parsed)) raw = parsed;
			else raw = (raw as string).split(',').map((t) => t.trim());
		}
		if (Array.isArray(raw)) {
			const sanitized = raw
				.map((t) => String(t).toLowerCase().replace(/[^a-z0-9-_\s]/g, '').trim())
				.filter(Boolean)
				.slice(0, TAG_LIMIT);
			return sanitized;
		}
		return [];
	} catch {
		return [];
	}
}

function shortAddress(addr: string) {
	if (!addr) return '';
	return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function validationError(message: string, status = 400) {
	return NextResponse.json({ error: message }, { status });
}

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
		const cursor = searchParams.get('cursor');
		const type = (searchParams.get('type') || 'all') as CreationType | 'all';
		const search = searchParams.get('search');
		const creator = searchParams.get('creator');

		const result = await listCreations({ limit, cursor, type, search, creator });
		return NextResponse.json(result, {
			headers: {
				'Cache-Control': 's-maxage=45, stale-while-revalidate=30',
			},
		});
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : 'Failed to list creations';
		return NextResponse.json({ error: msg }, { status: 500 });
	}
}

export async function POST(req: NextRequest) {
	try {
		const form = await req.formData();
		const type = (form.get('type') as CreationType | null) || null;
		const title = cleanText(String(form.get('title') || ''), TITLE_LIMIT);
		const description = cleanText(String(form.get('description') || ''), DESCRIPTION_LIMIT);
		const creatorAddress = cleanText(String(form.get('creatorAddress') || ''), 200);
		const glyphId = cleanText(String(form.get('glyphId') || ''), 120) || undefined;
		const xHandle = cleanText(String(form.get('xHandle') || ''), 50) || undefined;
		const glyphVerifiedRaw = form.get('glyphVerified');
		const glyphVerified = glyphVerifiedRaw === 'true' || glyphVerifiedRaw === '1';
		const tags = parseTags(form.get('tags'));
		const codeText = form.get('code') as string | null;
		const artifact = form.get('artifact') as File | null;
	const soundUrl = form.get('soundUrl') as string | null;
	const soundProvider = form.get('soundProvider') as ('soundcloud' | 'spotify' | null);

		if (!type || !ALLOWED_TYPES.includes(type)) {
			return validationError('Invalid creation type');
		}
		if (!title) return validationError('Title is required');
		if (title.length > TITLE_LIMIT) return validationError('Title too long');
		if (description.length > DESCRIPTION_LIMIT) return validationError('Description too long');
		if (!creatorAddress) return validationError('Creator address is required');
		if (tags.length > TAG_LIMIT) return validationError('Too many tags');

		if (type === 'code') {
			if (!codeText || !codeText.trim()) return validationError('Code is required for code type');
		} else if (type === 'sound' && soundUrl) {
			const allowed =
				soundUrl.includes('soundcloud.com') ||
				soundUrl.includes('open.spotify.com') ||
				soundUrl.includes('spotify.com');
			if (!allowed) return validationError('Sound URL must be SoundCloud or Spotify');
		} else {
			if (!artifact) return validationError('Artifact file is required');
			if (artifact.size > MAX_FILE_BYTES) {
				return validationError(`File too large. Max ${MAX_FILE_MB}MB`);
			}
		}

		const id = crypto.randomUUID();
		const createdAt = new Date().toISOString();

		const artifactResult = soundUrl
			? {
					uri: soundUrl,
					mime: 'text/uri-list',
					size: 0,
					text: undefined,
					externalUrl: soundUrl,
					provider: soundProvider || (soundUrl.includes('soundcloud') ? 'soundcloud' : 'spotify'),
					providerLabel: 'external',
			  }
			: await uploadArtifact({
					file: type === 'code' ? undefined : artifact || undefined,
					text: type === 'code' ? codeText || undefined : undefined,
					filename: type === 'code' ? 'code.txt' : (artifact as File | null)?.name,
					mime: type === 'code' ? 'text/plain' : (artifact as File | null)?.type,
			  });

		const glyphProfile: GlyphProfile | undefined = glyphId || xHandle || glyphVerified
			? { glyphId, xHandle, verified: glyphVerified }
			: undefined;

		const metadata = {
			id,
			creatorAddress,
			glyphProfile,
			type,
			title,
			description,
			tags,
			artifact: {
				uri: artifactResult.uri,
				mime: artifactResult.mime,
				size: artifactResult.size,
				externalUrl: artifactResult.externalUrl,
				provider: soundUrl ? (soundProvider || (soundUrl.includes('soundcloud') ? 'soundcloud' as const : 'spotify' as const)) : 'upload' as const,
				text: type === 'code' ? codeText || undefined : undefined,
			},
			createdAt,
		};

		const metadataUpload = await uploadMetadata(metadata);

		const record: CreationRecord = {
			...metadata,
			codePreview: type === 'code' ? (codeText || '').slice(0, 200) : undefined,
			artifactUrl: artifactResult.uri,
			metadataUrl: metadataUpload.uri,
			contentHash: metadataUpload.contentHash,
		};

		await createCreation(record);
		await addExperience(creatorAddress, type);

		return NextResponse.json(
			{
				creation: record,
				storageProvider: artifactResult.provider,
				metadataProvider: metadataUpload.provider,
				shortCreator: shortAddress(creatorAddress),
			},
			{ status: 201 },
		);
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : 'Failed to create';
		return NextResponse.json({ error: msg }, { status: 500 });
	}
}


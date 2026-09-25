'use server';

import { NextRequest, NextResponse } from 'next/server';
import { uploadArtifact, uploadMetadata } from '@/lib/studio/storage';
import { createCreation, countTransmissionsToday, listCreations } from '@/lib/studio/persistence';
import { CreationRecord, CreationType, GlyphProfile } from '@/lib/studio/types';
import { getSupabaseServerClient } from '@/lib/supabase';
import { authFailure, requireAuthenticatedApe } from '@/lib/auth/ape';
import { awardDailyActivity } from '@/lib/progress/hooks';
import { recordPersistedStudioCreation } from '@/lib/progress/studio-activity';
import { AOA_DAILY_CAPS } from '@/lib/progress/rewards';

const TITLE_LIMIT = 80;
const TAG_LIMIT = 5;
const PROMPT_LIMIT = 1000;
const MAX_FILE_MB = Number(process.env.STUDIO_MAX_FILE_MB || '20');
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

const ALLOWED_TYPES: CreationType[] = ['visual'];

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

function parseLinkedWallets(raw: unknown): string[] {
	if (!raw) return [];
	try {
		const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
		if (!Array.isArray(parsed)) return [];
		return parsed
			.map((item) => String((item as { address?: string })?.address || '').toLowerCase())
			.filter(Boolean);
	} catch {
		return [];
	}
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
		const prompt = cleanText(String(form.get('prompt') || ''), PROMPT_LIMIT);
		const requestedAddress = cleanText(String(form.get('creatorAddress') || ''), 200).toLowerCase();
		const linkedWallets = parseLinkedWallets(form.get('linkedWallets'));
		const ape = await requireAuthenticatedApe(req, [requestedAddress, ...linkedWallets], linkedWallets);
		const creatorAddress = ape.wallets.includes(requestedAddress) ? requestedAddress : (ape.primaryWallet || '');
		const glyphId = ape.userId;
		const privyUserId = ape.userId;
		const gamifyUserId = ape.userId;
		const xHandle = ape.handle || undefined;
		const glyphVerified = Boolean(ape.handle);
		const tags = parseTags(null);
		const artifact = form.get('artifact') as File | null;

		const remixFields = ['isRemix', 'remixOf', 'sourceCreationId', 'parentId', 'remixFrom', 'remixId'];
		if (remixFields.some((field) => {
			const value = String(form.get(field) || '').trim().toLowerCase();
			return value === 'true' || value === '1' || (value && value !== 'false');
		})) {
			return validationError('Studio remixing is no longer supported.');
		}

		if (!type || !ALLOWED_TYPES.includes(type)) {
			return validationError('Invalid creation type');
		}
		if (!title) return validationError('Title is required');
		if (title.length > TITLE_LIMIT) return validationError('Title too long');
		if (!prompt) return validationError('Prompt is required');
		if (!creatorAddress) return validationError('Link a wallet before publishing.');
		if (tags.length > TAG_LIMIT) return validationError('Too many tags');

		const publishedToday = await countTransmissionsToday(ape.userId, ape.wallets);
		if (publishedToday >= AOA_DAILY_CAPS.studioPublish) {
			return validationError('You can publish 5 transmissions a day. The next one opens after midnight UTC.', 429);
		}

		const id = crypto.randomUUID();
		const createdAt = new Date().toISOString();

		if (!artifact) return validationError('Artifact file is required');
		if (artifact.size > MAX_FILE_BYTES) {
			return validationError(`File too large. Max ${MAX_FILE_MB}MB`);
		}
		const imageName = (artifact.name || '').toLowerCase();
		const imageByName = /\.(png|jpe?g|gif|webp|avif)$/.test(imageName);
		if (!artifact.type.startsWith('image/') && !imageByName) {
			return validationError('Only image uploads are supported');
		}

		let artifactResult;
		try {
			artifactResult = await uploadArtifact({
				file: artifact,
				filename: (artifact as File | null)?.name,
				mime: (artifact as File | null)?.type,
			});
		} catch (err) {
			throw err;
		}

		const glyphProfile: GlyphProfile | undefined = glyphId || xHandle || glyphVerified
			? { glyphId, xHandle, verified: glyphVerified }
			: undefined;

		const metadata = {
			id,
			creatorAddress,
			glyphProfile,
			type,
			title,
			description: '',
			tags,
			artifact: {
				uri: artifactResult.uri,
				mime: artifactResult.mime,
				size: artifactResult.size,
				externalUrl: artifactResult.externalUrl,
				provider: 'upload' as const,
				prompt,
			},
			createdAt,
		};

		const metadataUpload = await uploadMetadata(metadata);

		const record: CreationRecord = {
			...metadata,
			artifactUrl: artifactResult.uri,
			metadataUrl: metadataUpload.uri,
			contentHash: metadataUpload.contentHash,
		};

		await createCreation(record);

		const canonicalUserId = await recordPersistedStudioCreation({
			creationId: id,
			createdAt,
			creatorAddress,
			claimedIds: [privyUserId || '', glyphId || ''],
			type,
			title,
		});
		if (canonicalUserId) {
			try {
				await awardDailyActivity(canonicalUserId);
			} catch (progressErr) {
				console.error(JSON.stringify({
					scope: 'studio-activity',
					event: 'daily_activity_failed',
					creationId: id,
					userId: canonicalUserId,
					reason: progressErr instanceof Error ? progressErr.message : 'unknown',
				}));
			}
		}

		if (gamifyUserId) {
			try {
				const supabase = getSupabaseServerClient();
				await supabase.rpc('progress_quest', {
					p_glyph_user_id: gamifyUserId,
					p_quest_code: 'daily_studio_publish',
					p_increment: 1,
				});
				await supabase.rpc('touch_engagement_streak', {
					p_glyph_user_id: gamifyUserId,
				});
			} catch (gamifyErr) {
				console.error('studio creation gamify:', gamifyErr);
			}
		}

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
		const denied = authFailure(e);
		if (denied) return denied;
		const msg = e instanceof Error ? e.message : 'Failed to create';
		return NextResponse.json({ error: msg }, { status: 500 });
	}
}


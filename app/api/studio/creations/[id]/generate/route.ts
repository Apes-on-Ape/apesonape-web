'use server';

import { NextRequest, NextResponse } from 'next/server';
import { uploadArtifact, uploadMetadata } from '@/lib/studio/storage';
import { createCreation, getCreation, releaseApeUse, reserveApeUse } from '@/lib/studio/persistence';
import { CreationRecord, CreationType, GlyphProfile } from '@/lib/studio/types';
import { toGatewayUri } from '@/lib/studio/urls';
import { addExperience } from '@/lib/studio/xp';
import { verifyApeOwnership } from '@/lib/studio/apechain';
import sharp from 'sharp';
 
 const TITLE_LIMIT = 80;
 const DESCRIPTION_LIMIT = 280;
 const MAX_FILE_MB = Number(process.env.STUDIO_MAX_FILE_MB || '20');
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;
const DALL_E_MAX_BYTES = 4 * 1024 * 1024;
 
async function buildStyleHint(imageUrl: string): Promise<string | null> {
	try {
		const res = await fetch(imageUrl);
		if (!res.ok) return null;
		const buffer = Buffer.from(await res.arrayBuffer());
		const stats = await sharp(buffer).stats();
		const r = Math.round(stats.channels[0]?.mean || 0);
		const g = Math.round(stats.channels[1]?.mean || 0);
		const b = Math.round(stats.channels[2]?.mean || 0);
		const hex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
		return [
			'Match the art style of the original creation image.',
			'Keep the same line weight, shading style, and overall aesthetic.',
			`Use a similar color palette; dominant tone ${hex}.`,
		].join(' ');
	} catch {
		return null;
	}
}

async function getMeanColor(imageUrl: string): Promise<{ r: number; g: number; b: number } | null> {
	try {
		const res = await fetch(imageUrl);
		if (!res.ok) return null;
		const buffer = Buffer.from(await res.arrayBuffer());
		const stats = await sharp(buffer).stats();
		return {
			r: stats.channels[0]?.mean || 0,
			g: stats.channels[1]?.mean || 0,
			b: stats.channels[2]?.mean || 0,
		};
	} catch {
		return null;
	}
}

 function cleanText(value: string, max: number) {
 	return value.replace(/\s+/g, ' ').replace(/[<>]/g, '').trim().slice(0, max);
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

async function generateImageFromPrompt(
	prompt: string,
	sourceImage: Blob,
	filename: string,
	styleHint?: string,
	options?: { useTransparentMask?: boolean },
) {
	const apiKey = process.env.OPENAI_API_KEY;
	if (!apiKey) {
		throw new Error('OPENAI_API_KEY is not configured');
	}

	const effectivePrompt = styleHint
		? `${prompt} ${styleHint}`
		: prompt;
	const inputBuffer = Buffer.from(await sourceImage.arrayBuffer());
	const normalized = await sharp(inputBuffer)
		.linear([1, 1, 1], [0, 0, 0])
		.resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
		.png()
		.toBuffer();
	if (normalized.byteLength > DALL_E_MAX_BYTES) {
		throw new Error('Converted image exceeds 4MB limit for DALL·E');
	}
	let mask: Buffer;
	if (options?.useTransparentMask) {
		mask = await sharp({
			create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
		})
			.png()
			.toBuffer();
	} else {
		const maskSize = 880;
		const maskOffset = Math.floor((1024 - maskSize) / 2);
		const centerMask = await sharp({
			create: { width: maskSize, height: maskSize, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 255 } },
		})
			.png()
			.toBuffer();
		mask = await sharp({
			create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
		})
			.composite([{ input: centerMask, left: maskOffset, top: maskOffset }])
			.png()
			.toBuffer();
	}

	const form = new FormData();
	form.append('model', 'gpt-image-1');
	form.append('prompt', effectivePrompt);
	form.append('size', '1024x1024');
	form.append('image', new Blob([new Uint8Array(normalized)], { type: 'image/png' }), filename || 'source.png');
	form.append('mask', new Blob([new Uint8Array(mask)], { type: 'image/png' }), 'mask.png');

	const res = await fetch('https://api.openai.com/v1/images/edits', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
		},
		body: form,
	});

	if (!res.ok) {
		const errText = await res.text().catch(() => '');
		throw new Error(errText || 'Image generation failed');
	}

	const json = (await res.json()) as { data?: Array<{ b64_json?: string; url?: string }> };
	let buffer: Buffer | null = null;
	const b64 = json?.data?.[0]?.b64_json;
	if (b64) {
		buffer = Buffer.from(b64, 'base64');
	} else if (json?.data?.[0]?.url) {
		const imageRes = await fetch(json.data[0].url);
		if (imageRes.ok) {
			buffer = Buffer.from(await imageRes.arrayBuffer());
		}
	}
	if (!buffer) {
		throw new Error('Image generation failed');
	}
	const blob = new Blob([new Uint8Array(buffer)], { type: 'image/png' });
	return {
		blob,
		filename: `aoa-studio-remix-${Date.now()}.png`,
		mime: 'image/png',
		size: buffer.byteLength,
	};
}
 
 export async function POST(
 	req: NextRequest,
 	{ params }: { params: Promise<{ id: string }> },
 ) {
 	try {
 		const { id } = await params;
 		const original = await getCreation(id);
 		if (!original) return NextResponse.json({ error: 'Not found' }, { status: 404 });
 
 		const prompt = original.artifact?.prompt || '';
 		if (!prompt) return validationError('Prompt missing on original creation');
 
 		const form = await req.formData();
 		const creatorAddress = cleanText(String(form.get('creatorAddress') || ''), 200);
 		const glyphId = cleanText(String(form.get('glyphId') || ''), 120) || undefined;
 		const xHandle = cleanText(String(form.get('xHandle') || ''), 50) || undefined;
 		const glyphVerifiedRaw = form.get('glyphVerified');
 		const glyphVerified = glyphVerifiedRaw === 'true' || glyphVerifiedRaw === '1';
		const apeIdRaw = cleanText(String(form.get('apeId') || ''), 20);
		const titleOverride = cleanText(String(form.get('title') || ''), TITLE_LIMIT);
		const linkedWallets = parseLinkedWallets(form.get('linkedWallets'));
		const artifact = form.get('artifact') as File | null;
		const matchOriginalRaw = form.get('matchOriginal');
		const matchOriginal = matchOriginalRaw === 'true' || matchOriginalRaw === '1';
		const characterDescription = cleanText(String(form.get('characterDescription') || ''), 280);

		if (!creatorAddress) return validationError('Creator address is required');
		const apeId = Number.parseInt(apeIdRaw, 10);
		if (!Number.isFinite(apeId) || apeId < 1) return validationError('Ape ID is required');
		const apeTokenId = apeId - 1;
		if (!matchOriginal && !artifact) return validationError('Artifact file is required when not matching original');
		if (artifact) {
			if (artifact.size > MAX_FILE_BYTES) {
				return validationError(`File too large. Max ${MAX_FILE_MB}MB`);
			}
			if (artifact.size > DALL_E_MAX_BYTES) {
				return validationError('Source image must be <= 4MB for DALL·E');
			}
			if (!artifact.type.startsWith('image/')) {
				return validationError('Only image uploads are supported');
			}
		}
 
		const addresses = Array.from(new Set([creatorAddress, ...linkedWallets].map((a) => a.toLowerCase()).filter(Boolean)));
		let ownsApe = false;
		for (const addr of addresses) {
			if (await verifyApeOwnership(addr, apeTokenId)) {
				ownsApe = true;
				break;
			}
		}
		if (!ownsApe) return validationError('Wallet does not own this ape');

		const creationId = crypto.randomUUID();
		try {
			await reserveApeUse(apeTokenId, creatorAddress.toLowerCase(), creationId);
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Ape already used';
			return validationError(msg);
		}

		try {
			const originalUrl = original.artifactUrl ? toGatewayUri(original.artifactUrl) : '';
			let sourceImageUrl: string;
			let editedPrompt: string;
			let inputForModel: Blob;
			let inputFilename: string;
			let useTransparentMask = false;

			const styleHint = originalUrl ? await buildStyleHint(originalUrl) : null;

			if (matchOriginal) {
				if (!originalUrl) return validationError('Original creation has no artifact to match');
				const res = await fetch(originalUrl);
				if (!res.ok) return validationError('Could not fetch original image');
				const origBuffer = Buffer.from(await res.arrayBuffer());
				const normalized = await sharp(origBuffer)
					.resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
					.png()
					.toBuffer();
				if (normalized.byteLength > DALL_E_MAX_BYTES) {
					return validationError('Original image too large for DALL·E after resize');
				}
				sourceImageUrl = originalUrl;
				editedPrompt = characterDescription
					? `Keep the exact same pose, composition, lighting, and color palette. Only replace the character with: ${characterDescription}. ${prompt}`
					: `Keep the exact same pose, composition, lighting, and color palette. ${prompt}`;
				inputForModel = new Blob([new Uint8Array(normalized)], { type: 'image/png' });
				inputFilename = 'original.png';
				useTransparentMask = true;
			} else {
				const sourceUpload = await uploadArtifact({
					file: artifact!,
					filename: (artifact as File)?.name,
					mime: (artifact as File)?.type,
				});
				sourceImageUrl = toGatewayUri(sourceUpload.uri);
				const originalMean = originalUrl ? await getMeanColor(originalUrl) : null;
				inputForModel = artifact!;
				inputFilename = artifact!.name || 'reference.png';
				editedPrompt = prompt;
				if (originalMean) {
					const inputBuffer = Buffer.from(await artifact!.arrayBuffer());
					const stats = await sharp(inputBuffer).stats();
					const src = {
						r: stats.channels[0]?.mean || 1,
						g: stats.channels[1]?.mean || 1,
						b: stats.channels[2]?.mean || 1,
					};
					const clamp = (v: number) => Math.min(1.5, Math.max(0.6, v));
					const rMul = clamp(originalMean.r / src.r);
					const gMul = clamp(originalMean.g / src.g);
					const bMul = clamp(originalMean.b / src.b);
					const adjusted = await sharp(inputBuffer)
						.linear([rMul, gMul, bMul], [0, 0, 0])
						.png()
						.toBuffer();
					inputForModel = new Blob([new Uint8Array(adjusted)], { type: 'image/png' });
					inputFilename = artifact!.name || 'reference.png';
				}
			}

			const generated = await generateImageFromPrompt(
				editedPrompt,
				inputForModel,
				inputFilename,
				matchOriginal ? undefined : styleHint || undefined,
				{ useTransparentMask },
			);
			if (generated.size > MAX_FILE_BYTES) {
				return validationError(`Generated file too large. Max ${MAX_FILE_MB}MB`);
			}

			const generatedArtifact = await uploadArtifact({
				file: generated.blob,
				filename: generated.filename,
				mime: generated.mime,
			});

			const createdAt = new Date().toISOString();
			const glyphProfile: GlyphProfile | undefined = glyphId || xHandle || glyphVerified
				? { glyphId, xHandle, verified: glyphVerified }
				: undefined;

			const baseTitle = cleanText(original.title || 'Remix', TITLE_LIMIT);
			const title = titleOverride || cleanText(`${baseTitle} Remix`, TITLE_LIMIT);
			const description = cleanText(`Remix of ${original.title || 'original prompt'}.`, DESCRIPTION_LIMIT);

			const metadata = {
				id: creationId,
				creatorAddress,
				glyphProfile,
				type: 'visual' as CreationType,
				title,
				description,
				tags: (original.tags || []).slice(0, 5),
				artifact: {
					uri: generatedArtifact.uri,
					mime: generatedArtifact.mime,
					size: generatedArtifact.size,
					externalUrl: generatedArtifact.externalUrl,
					provider: 'openai' as const,
					prompt,
					generator: {
						provider: 'openai' as const,
						sourceImageUrl,
						sourceCreationId: original.id,
					},
					apeId: apeTokenId,
				},
				createdAt,
			};

			const metadataUpload = await uploadMetadata(metadata);

			const record: CreationRecord = {
				...metadata,
				artifactUrl: generatedArtifact.uri,
				metadataUrl: metadataUpload.uri,
				contentHash: metadataUpload.contentHash,
			};

			await createCreation(record);
			await addExperience(creatorAddress, 'visual');

			return NextResponse.json({ creation: record }, { status: 201 });
		} catch (err) {
			await releaseApeUse(apeTokenId, creatorAddress.toLowerCase());
			throw err;
		}
 
 	} catch (e: unknown) {
 		const msg = e instanceof Error ? e.message : 'Failed to generate';
 		return NextResponse.json({ error: msg }, { status: 500 });
 	}
 }

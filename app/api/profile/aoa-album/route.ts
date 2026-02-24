import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createFolderAndUploadOAuth, refreshAccessToken } from '@/lib/drive-oauth';

// Netlify Lambda: ~6MB request limit (4.5MB for binary). Enforce 4MB total to stay safe.
const MAX_TOTAL_MB = 4;

const MAX_SONG_MB = 50;
const MAX_COVER_MB = 10;
const MAX_SONGS = 25;

const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/wave'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_AUDIO_EXT = ['.mp3', '.wav'];
const ALLOWED_IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.webp'];

function getExt(name: string): string {
	const i = name.lastIndexOf('.');
	return i >= 0 ? name.slice(i).toLowerCase() : '';
}

function isAllowedAudio(file: File): boolean {
	const ext = getExt(file.name);
	const type = file.type?.toLowerCase() || '';
	return (
		ALLOWED_AUDIO_EXT.includes(ext) &&
		(ALLOWED_AUDIO_TYPES.includes(type) || type.startsWith('audio/'))
	);
}

function isAllowedImage(file: File): boolean {
	const ext = getExt(file.name);
	const type = file.type?.toLowerCase() || '';
	return (
		ALLOWED_IMAGE_EXT.includes(ext) &&
		(ALLOWED_IMAGE_TYPES.includes(type) || type.startsWith('image/'))
	);
}

export async function POST(req: NextRequest) {
	try {
		const form = await req.formData();
		const folderName = String(form.get('folderName') || '').trim();
		const songs = form.getAll('songs') as File[];
		const cover = form.get('cover') as File | null;

		if (!folderName || folderName.length > 100) {
			return NextResponse.json(
				{ error: 'Album name is required (max 100 characters)' },
				{ status: 400 }
			);
		}

		// Sanitize folder name for Drive (remove invalid chars)
		const safeFolderName = folderName.replace(/[<>:"/\\|?*]/g, '_').trim() || 'AOA Album';

		if (!songs?.length || songs.length > MAX_SONGS) {
			return NextResponse.json(
				{ error: `Add 1–${MAX_SONGS} songs (MP3 or WAV only)` },
				{ status: 400 }
			);
		}

		if (!cover || !(cover instanceof File) || cover.size === 0) {
			return NextResponse.json(
				{ error: 'Album cover image is required (JPG, PNG, or WebP)' },
				{ status: 400 }
			);
		}

		// Validate all songs
		for (const song of songs) {
			if (!(song instanceof File) || song.size === 0) continue;
			if (!isAllowedAudio(song)) {
				return NextResponse.json(
					{ error: `Invalid file: "${song.name}". Only MP3 and WAV are allowed.` },
					{ status: 400 }
				);
			}
			if (song.size > MAX_SONG_MB * 1024 * 1024) {
				return NextResponse.json(
					{ error: `"${song.name}" exceeds ${MAX_SONG_MB}MB limit` },
					{ status: 400 }
				);
			}
		}

		// Validate cover
		if (!isAllowedImage(cover)) {
			return NextResponse.json(
				{ error: 'Album cover must be JPG, PNG, or WebP' },
				{ status: 400 }
			);
		}
		if (cover.size > MAX_COVER_MB * 1024 * 1024) {
			return NextResponse.json(
				{ error: `Album cover exceeds ${MAX_COVER_MB}MB limit` },
				{ status: 400 }
			);
		}

		// Netlify/serverless: total request body must stay under ~4MB
		let totalBytes = cover.size;
		for (const song of songs) {
			if (song instanceof File && song.size > 0) totalBytes += song.size;
		}
		if (totalBytes > MAX_TOTAL_MB * 1024 * 1024) {
			return NextResponse.json(
				{ error: `Total album size exceeds ${MAX_TOTAL_MB}MB limit (Netlify). Use fewer or smaller files.` },
				{ status: 400 }
			);
		}

		// Get OAuth token from cookie
		const cookieStore = await cookies();
		const driveCookie = cookieStore.get('drive_oauth');
		if (!driveCookie?.value) {
			return NextResponse.json(
				{ error: 'Connect Google Drive first. Click "Connect Google Drive" above.' },
				{ status: 401 }
			);
		}
		let tokenData: { access_token: string; refresh_token: string; expiry: number };
		try {
			tokenData = JSON.parse(driveCookie.value) as { access_token: string; refresh_token: string; expiry: number };
		} catch {
			return NextResponse.json(
				{ error: 'Invalid Drive session. Please connect Google Drive again.' },
				{ status: 401 }
			);
		}
		let accessToken = tokenData.access_token;
		if (Date.now() >= tokenData.expiry && tokenData.refresh_token) {
			const refreshed = await refreshAccessToken(tokenData.refresh_token);
			accessToken = refreshed.accessToken;
		}

		const files: Array<{ name: string; buffer: Buffer; mimeType: string }> = [];

		// Add cover first (as cover.jpg or cover.png)
		const coverExt = getExt(cover.name) || '.jpg';
		const coverName = `cover${coverExt}`;
		files.push({
			name: coverName,
			buffer: Buffer.from(await cover.arrayBuffer()),
			mimeType: cover.type || 'image/jpeg',
		});

		// Add songs
		for (const song of songs) {
			if (!(song instanceof File) || song.size === 0) continue;
			const name = song.name.replace(/[<>:"/\\|?*]/g, '_') || `track-${files.length}.mp3`;
			files.push({
				name,
				buffer: Buffer.from(await song.arrayBuffer()),
				mimeType: song.type || 'audio/mpeg',
			});
		}

		const parentFolderId = process.env.GOOGLE_DRIVE_ALBUM_FOLDER_ID?.trim() || undefined;

		const { folderId, uploadedCount } = await createFolderAndUploadOAuth(
			accessToken,
			safeFolderName,
			files,
			parentFolderId
		);

		return NextResponse.json({
			ok: true,
			folderId,
			uploadedCount,
			message: `Album "${safeFolderName}" uploaded successfully (${uploadedCount} files)`,
		});
	} catch (e: unknown) {
		let msg = 'Upload failed';
		if (e instanceof Error) {
			msg = e.message;
			// Extract Google API error details if present
			const gerr = (e as { response?: { data?: { error?: { message?: string } } } }).response;
			if (gerr?.data?.error?.message) {
				msg = gerr.data.error.message;
			}
			console.error('[aoa-album]', e.message, e);
		}
		return NextResponse.json({ error: msg }, { status: 500 });
	}
}

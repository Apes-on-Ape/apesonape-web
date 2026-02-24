/**
 * Google Drive upload using OAuth (user's own Drive).
 * No service account or Workspace needed.
 */

import { Readable } from 'stream';
import { google } from 'googleapis';

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiry: number }> {
	const clientId = process.env.GOOGLE_CLIENT_ID;
	const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
	if (!clientId || !clientSecret) {
		throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET required for Drive OAuth');
	}
	const res = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			client_id: clientId,
			client_secret: clientSecret,
			refresh_token: refreshToken,
			grant_type: 'refresh_token',
		}),
	});
	if (!res.ok) {
		const err = await res.text();
		throw new Error(`Token refresh failed: ${err}`);
	}
	const json = (await res.json()) as { access_token?: string; expires_in?: number };
	if (!json.access_token) throw new Error('No access_token in refresh response');
	const expiry = Date.now() + (json.expires_in || 3600) * 1000 - 60000; // 1 min buffer
	return { accessToken: json.access_token, expiry };
}

export type UploadProgressCallback = (uploaded: number, total: number, isCover: boolean) => void;

export async function createFolderAndUploadOAuth(
	accessToken: string,
	folderName: string,
	files: Array<{ name: string; buffer: Buffer; mimeType: string }>,
	parentFolderId?: string,
	onProgress?: UploadProgressCallback
): Promise<{ folderId: string; uploadedCount: number }> {
	const auth = new google.auth.OAuth2();
	auth.setCredentials({ access_token: accessToken });

	const drive = google.drive({ version: 'v3', auth });

	const parents = parentFolderId ? [parentFolderId] : undefined;
	const folderRes = await drive.files.create({
		requestBody: {
			name: folderName,
			mimeType: 'application/vnd.google-apps.folder',
			...(parents && { parents }),
		},
		fields: 'id',
	});
	const folderId = folderRes.data.id;
	if (!folderId) throw new Error('Failed to create folder');

	const total = files.length;
	let uploadedCount = 0;
	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		await drive.files.create({
			requestBody: {
				name: file.name,
				parents: [folderId],
			},
			media: {
				mimeType: file.mimeType,
				body: Readable.from(file.buffer),
			},
		});
		uploadedCount++;
		onProgress?.(uploadedCount, total, i === 0);
	}

	return { folderId, uploadedCount };
}

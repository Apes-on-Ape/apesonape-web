/**
 * Google Drive upload utilities for AOA albums.
 * Supports (in order of precedence):
 * - GOOGLE_DRIVE_CREDENTIALS_PATH: path to JSON file
 * - GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY: base64-encoded JSON
 * - GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON: JSON string (single line in .env)
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Readable } from 'stream';
import { google } from 'googleapis';

const AOA_DRIVE_PARENT_FOLDER_ID = '1V5JGt8EtjNgbQ74sxD5e2v2_Lv0KcHnz';
// drive scope needed for Shared Drive uploads (drive.file can fail with storage quota error)
const SCOPES = ['https://www.googleapis.com/auth/drive'];

function getAuthClient() {
	const filePath = process.env.GOOGLE_DRIVE_CREDENTIALS_PATH;
	const base64Key = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY;
	const jsonStr = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON;

	let credentials: object;
	if (filePath) {
		try {
			const absPath = resolve(process.cwd(), filePath);
			const raw = readFileSync(absPath, 'utf-8');
			credentials = JSON.parse(raw) as object;
		} catch (e) {
			throw new Error(`Invalid GOOGLE_DRIVE_CREDENTIALS_PATH: ${e instanceof Error ? e.message : 'file not found'}`);
		}
	} else if (base64Key) {
		try {
			const decoded = Buffer.from(base64Key, 'base64').toString('utf-8');
			credentials = JSON.parse(decoded) as object;
		} catch {
			throw new Error('Invalid GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY');
		}
	} else if (jsonStr) {
		// Strip newlines/whitespace that .env may introduce
		const cleaned = jsonStr.replace(/\s+/g, ' ').trim();
		try {
			credentials = JSON.parse(cleaned) as object;
		} catch {
			throw new Error('Invalid GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON (must be valid JSON, ideally single line)');
		}
	} else {
		throw new Error('Missing GOOGLE_DRIVE_CREDENTIALS_PATH, GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY, or GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON');
	}

	const auth = new google.auth.GoogleAuth({
		credentials,
		scopes: SCOPES,
	});
	return auth;
}

export async function createFolderAndUpload(
	parentFolderId: string,
	folderName: string,
	files: Array<{ name: string; buffer: Buffer; mimeType: string }>
): Promise<{ folderId: string; uploadedCount: number }> {
	const auth = getAuthClient();
	const drive = google.drive({ version: 'v3', auth });

	// Create folder under parent (supportsAllDrives required for Shared Drives)
	const folderRes = await drive.files.create({
		requestBody: {
			name: folderName,
			mimeType: 'application/vnd.google-apps.folder',
			parents: [parentFolderId],
		},
		supportsAllDrives: true,
		fields: 'id',
	});
	const folderId = folderRes.data.id;
	if (!folderId) throw new Error('Failed to create folder');

	let uploadedCount = 0;
	for (const file of files) {
		await drive.files.create({
			requestBody: {
				name: file.name,
				parents: [folderId],
			},
			media: {
				mimeType: file.mimeType,
				body: Readable.from(file.buffer),
			},
			supportsAllDrives: true,
		});
		uploadedCount++;
	}

	return { folderId, uploadedCount };
}

export function getAoaDriveParentFolderId(): string {
	return process.env.AOA_DRIVE_PARENT_FOLDER_ID || AOA_DRIVE_PARENT_FOLDER_ID;
}

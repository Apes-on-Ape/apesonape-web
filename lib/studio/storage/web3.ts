import { ArtifactInfo } from '../types';

type UploadArgs = {
	file?: File | Blob;
	text?: string;
	filename?: string;
	mime?: string;
};

const WEB3_STORAGE_API = 'https://api.web3.storage/upload';

function getToken() {
	const token = process.env.WEB3_STORAGE_TOKEN;
	if (!token) throw new Error('WEB3_STORAGE_TOKEN is not configured');
	return token;
}

export async function uploadArtifactWeb3(args: UploadArgs): Promise<ArtifactInfo> {
	const token = getToken();
	let body: BodyInit;
	let mime = args.mime || 'application/octet-stream';
	let size: number | undefined;

	if (args.text) {
		const blob = new Blob([args.text], { type: args.mime || 'text/plain' });
		body = blob;
		mime = blob.type || mime;
		size = blob.size;
	} else if (args.file) {
		body = args.file;
		mime = args.file.type || mime;
		size = (args.file as File).size;
	} else {
		throw new Error('Missing artifact');
	}

	const res = await fetch(WEB3_STORAGE_API, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': mime,
			'X-NAME': args.filename || (args.file as File | undefined)?.name || 'artifact.bin',
		},
		body,
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || 'web3.storage upload failed');
	}
	const json = (await res.json()) as { cid?: string };
	const cid = json.cid;
	if (!cid) throw new Error('web3.storage upload missing cid');

	return {
		uri: `ipfs://${cid}`,
		mime,
		size,
		text: args.text || undefined,
	};
}

export async function uploadMetadataWeb3(metadataJson: string): Promise<{ uri: string }> {
	const token = getToken();
	const res = await fetch(WEB3_STORAGE_API, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
			'X-NAME': 'studio-metadata.json',
		},
		body: metadataJson,
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || 'web3.storage metadata upload failed');
	}
	const json = (await res.json()) as { cid?: string };
	const cid = json.cid;
	if (!cid) throw new Error('web3.storage metadata upload missing cid');
	return { uri: `ipfs://${cid}` };
}


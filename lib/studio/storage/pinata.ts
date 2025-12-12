import { ArtifactInfo } from '../types';

type UploadArgs = {
	file?: File | Blob;
	text?: string;
	filename?: string;
	mime?: string;
};

const PINATA_API = 'https://api.pinata.cloud';

function getAuthHeader() {
	const jwt = process.env.PINATA_JWT;
	if (!jwt) throw new Error('PINATA_JWT is not configured');
	return `Bearer ${jwt}`;
}

export async function uploadArtifactPinata(args: UploadArgs): Promise<ArtifactInfo> {
	const jwtHeader = getAuthHeader();
	const form = new FormData();

	if (args.text) {
		const blob = new Blob([args.text], { type: args.mime || 'text/plain' });
		form.append('file', blob, args.filename || 'artifact.txt');
	} else if (args.file) {
		form.append('file', args.file, (args.filename || (args.file as File)?.name || 'artifact.bin'));
	} else {
		throw new Error('Missing artifact');
	}

	const res = await fetch(`${PINATA_API}/pinning/pinFileToIPFS`, {
		method: 'POST',
		headers: { Authorization: jwtHeader },
		body: form,
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || 'Pinata upload failed');
	}

	const json = (await res.json()) as { IpfsHash?: string };
	const cid = json.IpfsHash;
	if (!cid) throw new Error('Pinata upload missing IpfsHash');

	const size = args.text ? new Blob([args.text]).size : (args.file ? (args.file as File).size : undefined);

	return {
		uri: `ipfs://${cid}`,
		mime: args.mime || (args.file as File | undefined)?.type || 'application/octet-stream',
		size,
		text: args.text || undefined,
	};
}

export async function uploadMetadataPinata(metadataJson: string): Promise<{ uri: string }> {
	const jwtHeader = getAuthHeader();
	const res = await fetch(`${PINATA_API}/pinning/pinJSONToIPFS`, {
		method: 'POST',
		headers: {
			Authorization: jwtHeader,
			'Content-Type': 'application/json',
		},
		body: metadataJson,
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || 'Pinata metadata upload failed');
	}
	const json = (await res.json()) as { IpfsHash?: string };
	const cid = json.IpfsHash;
	if (!cid) throw new Error('Pinata metadata upload missing IpfsHash');
	return { uri: `ipfs://${cid}` };
}


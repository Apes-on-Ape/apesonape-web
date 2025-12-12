import { keccak256, stringToBytes } from 'viem';
import { uploadArtifactPinata, uploadMetadataPinata } from './pinata';
import { uploadArtifactWeb3, uploadMetadataWeb3 } from './web3';
import { uploadArtifactFallback, uploadMetadataFallback } from './fallback';
import { ArtifactInfo } from '../types';

type UploadArgs = {
	file?: File | Blob;
	text?: string;
	filename?: string;
	mime?: string;
};

type Provider = {
	uploadArtifact: (args: UploadArgs) => Promise<ArtifactInfo>;
	uploadMetadata: (metadataJson: string) => Promise<{ uri: string }>;
	kind: 'pinata' | 'web3.storage' | 'fallback';
};

const pinataProvider: Provider = {
	kind: 'pinata',
	uploadArtifact: uploadArtifactPinata,
	uploadMetadata: uploadMetadataPinata,
};

const web3StorageProvider: Provider = {
	kind: 'web3.storage',
	uploadArtifact: uploadArtifactWeb3,
	uploadMetadata: uploadMetadataWeb3,
};

const fallbackProvider: Provider = {
	kind: 'fallback',
	uploadArtifact: uploadArtifactFallback,
	uploadMetadata: uploadMetadataFallback,
};

export function storageProviderFactory(): Provider {
	if (process.env.PINATA_JWT) return pinataProvider;
	if (process.env.WEB3_STORAGE_TOKEN) return web3StorageProvider;
	return fallbackProvider;
}

export async function uploadArtifact(args: UploadArgs): Promise<ArtifactInfo> {
	const provider = storageProviderFactory();
	const artifact = await provider.uploadArtifact(args);
	return artifact;
}

export async function uploadMetadata(
	metadata: unknown,
): Promise<{ uri: string; contentHash: string; metadataString: string; provider: string }> {
	const provider = storageProviderFactory();
	const metadataString = typeof metadata === 'string' ? metadata : JSON.stringify(metadata);
	const { uri } = await provider.uploadMetadata(metadataString);
	const contentHash = keccak256(stringToBytes(metadataString));
	return { uri, contentHash, metadataString, provider: provider.kind };
}


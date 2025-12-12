export type CreationType = 'sound' | 'visual' | 'interactive' | 'code';

export type GlyphProfile = {
	glyphId?: string;
	xHandle?: string;
	verified?: boolean;
};

export type ArtifactInfo = {
	uri: string;
	mime?: string;
	size?: number;
	text?: string;
};

export type CreationMetadata = {
	id: string;
	creatorAddress: string;
	glyphProfile?: GlyphProfile;
	type: CreationType;
	title: string;
	description: string;
	tags: string[];
	artifact: ArtifactInfo;
	metadataUrl?: string;
	contentHash?: string;
	createdAt: string;
};

export type CreationRecord = CreationMetadata & {
	codePreview?: string;
	artifactUrl: string;
	metadataUrl: string;
	contentHash: string;
};


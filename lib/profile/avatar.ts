export const APE_THUMB_BASE = 'https://bqcrbcpmimfojnjdhvrz.supabase.co/storage/v1/object/public/collection/collection-thumbs';

export function apeThumb(tokenId: number) {
	return `${APE_THUMB_BASE}/${tokenId}.webp`;
}

/**
 * The profile image is the Forever Ape.
 * `avatar_token_id` stays on the profile row for a possible later custom avatar.
 * It is not used as a second image.
 */
export function resolveAvatarToken(_avatarTokenId: number | null, foreverApeId: number | null, owned: Set<number>) {
	if (foreverApeId != null && owned.has(foreverApeId)) return foreverApeId;
	return null;
}

export function parseDisplayName(value: string) {
	const name = value.trim().replace(/\s+/g, ' ');
	if (!name) return { error: 'Display name cannot be empty.' };
	if (name.length > 32) return { error: 'Display name must be 32 characters or fewer.' };
	if (/[<>]/.test(name)) return { error: 'Display name cannot include HTML.' };
	return { name };
}

import { NextRequest, NextResponse } from 'next/server';
import { buildSelectedApePayloadForArcade } from '@/lib/arcade-forever-ape';
import { apeThumb, parseDisplayName, resolveAvatarToken } from '@/lib/profile/avatar';
import { allowedWallets, ownedApeIds } from '@/lib/profile/linked-wallets';
import { verifyPrivyUserId } from '@/lib/profile/privy-access-token';
import { createNotification } from '@/lib/notifications/create';
import { getSupabaseServiceClient } from '@/lib/supabase';

function missingColumn(error: { message?: string } | null) {
	return /avatar_token_id/i.test(error?.message ?? '');
}

async function authorized(req: NextRequest) {
	try {
		return await verifyPrivyUserId(req.headers.get('authorization'));
	} catch {
		return '';
	}
}

export async function GET(req: NextRequest) {
	const userId = await authorized(req);
	if (!userId) return NextResponse.json({ error: 'Sign in again.' }, { status: 401 });
	const supabase = getSupabaseServiceClient();
	if (!supabase) return NextResponse.json({ error: 'Profile settings are unavailable.' }, { status: 503 });

	let profileResult = await supabase
		.from('user_profiles')
		.select('display_name, x_username, forever_ape_id, avatar_token_id, wallet_address')
		.eq('glyph_user_id', userId)
		.maybeSingle();
	let avatarColumn = true;
	if (missingColumn(profileResult.error)) {
		avatarColumn = false;
		profileResult = await supabase
			.from('user_profiles')
			.select('display_name, x_username, forever_ape_id, wallet_address')
			.eq('glyph_user_id', userId)
			.maybeSingle();
	}
	if (profileResult.error) return NextResponse.json({ error: profileResult.error.message }, { status: 500 });

	const profile = profileResult.data;
	const foreverApeId = profile?.forever_ape_id != null ? Number(profile.forever_ape_id) : null;
	const storedAvatar = avatarColumn && profile && 'avatar_token_id' in profile && profile.avatar_token_id != null
		? Number(profile.avatar_token_id)
		: null;
	const handle = profile?.x_username ? String(profile.x_username).replace(/^@/, '') : null;

	if (req.nextUrl.searchParams.get('lite') === '1') {
		const token = foreverApeId;
		return NextResponse.json({
			displayName: profile?.display_name?.trim() || null,
			handle,
			foreverApeId,
			avatarTokenId: storedAvatar,
			avatarUrl: token != null ? apeThumb(token) : null,
		});
	}

	const connected = req.nextUrl.searchParams.getAll('wallet');
	const wallets = await allowedWallets(userId, connected);
	const owned = await ownedApeIds(wallets);
	const ownedSet = new Set(owned);
	const resolved = resolveAvatarToken(storedAvatar, foreverApeId, ownedSet);
	return NextResponse.json({
		displayName: profile?.display_name?.trim() || null,
		handle,
		foreverApeId,
		avatarTokenId: storedAvatar,
		resolvedAvatarToken: resolved,
		ownedTokenIds: owned.slice(0, 120),
		avatarColumn,
		avatarUrl: resolved != null ? apeThumb(resolved) : null,
	});
}

export async function PUT(req: NextRequest) {
	const userId = await authorized(req);
	if (!userId) return NextResponse.json({ error: 'Sign in again.' }, { status: 401 });
	const supabase = getSupabaseServiceClient();
	if (!supabase) return NextResponse.json({ error: 'Profile settings are unavailable.' }, { status: 503 });

	const body = (await req.json().catch(() => ({}))) as {
		displayName?: string;
		avatarTokenId?: number | null;
		foreverApeId?: number;
		connectedWallets?: string[];
	};
	const warnings: string[] = [];
	const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

	if (typeof body.displayName === 'string') {
		const parsed = parseDisplayName(body.displayName);
		if ('error' in parsed && parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });
		patch.display_name = parsed.name;
	}

	const needsOwnership = body.foreverApeId != null || body.avatarTokenId != null;
	const owned = needsOwnership ? new Set(await ownedApeIds(await allowedWallets(userId, body.connectedWallets ?? []))) : new Set<number>();

	let foreverChanged = false;
	if (body.foreverApeId != null) {
		const apeId = Number(body.foreverApeId);
		if (!Number.isInteger(apeId) || apeId < 0) return NextResponse.json({ error: 'Choose an Ape you hold.' }, { status: 400 });
		if (!owned.has(apeId)) return NextResponse.json({ error: 'That Ape is not held by a linked wallet.' }, { status: 403 });
		const previous = await supabase.from('user_profiles').select('forever_ape_id').eq('glyph_user_id', userId).maybeSingle();
		foreverChanged = Number(previous.data?.forever_ape_id) !== apeId;
		patch.forever_ape_id = apeId;
		patch.selected_ape = await buildSelectedApePayloadForArcade(apeId);
	}

	if ('avatarTokenId' in body) {
		if (body.avatarTokenId == null) {
			patch.avatar_token_id = null;
		} else {
			const tokenId = Number(body.avatarTokenId);
			if (!Number.isInteger(tokenId) || tokenId < 0 || !owned.has(tokenId)) {
				return NextResponse.json({ error: 'That avatar Ape is not held by a linked wallet.' }, { status: 403 });
			}
			patch.avatar_token_id = tokenId;
		}
	}

	const updated = await supabase.from('user_profiles').update(patch).eq('glyph_user_id', userId).select('glyph_user_id');
	if (updated.error && missingColumn(updated.error) && 'avatar_token_id' in patch) {
		delete patch.avatar_token_id;
		warnings.push('Avatar selection needs the profile avatar column. Display name and Forever Ape were still saved.');
		const retry = await supabase.from('user_profiles').update(patch).eq('glyph_user_id', userId).select('glyph_user_id');
		if (retry.error) return NextResponse.json({ error: retry.error.message }, { status: 500 });
		if (!retry.data?.length) return NextResponse.json({ error: 'Sign in again so your profile exists.' }, { status: 404 });
	} else {
		if (updated.error) return NextResponse.json({ error: updated.error.message }, { status: 500 });
		if (!updated.data?.length) return NextResponse.json({ error: 'Sign in again so your profile exists.' }, { status: 404 });
	}
	if (foreverChanged && body.foreverApeId != null) {
		await createNotification({
			userId,
			type: 'forever_ape',
			category: 'profile',
			title: 'Forever Ape updated',
			message: `Ape #${Number(body.foreverApeId)} is now your Forever Ape.`,
			actionLabel: 'View Ape',
			actionUrl: `/collection/${Number(body.foreverApeId)}/`,
			referenceType: 'ape',
			referenceId: String(body.foreverApeId),
			dedupeKey: `forever-ape:${Number(body.foreverApeId)}:${userId}`,
		});
	}
	return NextResponse.json({ ok: true, warnings });
}

import { NextRequest, NextResponse } from 'next/server';
import { authFailure, requireAuthenticatedApe } from '@/lib/auth/ape';
import { getSupabaseServerClient, getSupabaseServiceClient } from '@/lib/supabase';

/**
 * Creates the signed-in Ape's profile on first visit.
 * The user id comes from the Privy access token. Body fields are metadata only.
 */
export async function POST(req: NextRequest) {
	try {
		const ape = await requireAuthenticatedApe(req);
		const body = (await req.json().catch(() => ({}))) as {
			displayName?: string | null;
			xUsername?: string | null;
			avatarUrl?: string | null;
		};
		const userId = ape.userId;
		const displayName = typeof body.displayName === 'string' ? body.displayName.trim().slice(0, 80) : null;
		const xUsername = typeof body.xUsername === 'string' ? body.xUsername.replace(/^@/, '').trim().slice(0, 20) : null;
		const avatarUrl = typeof body.avatarUrl === 'string' ? body.avatarUrl.trim().slice(0, 500) : null;

		const supabase = getSupabaseServerClient();
		const service = getSupabaseServiceClient();

		const { data: existingProfile } = await supabase
			.from('user_profiles')
			.select('glyph_user_id, display_name, x_username, avatar_url')
			.eq('glyph_user_id', userId)
			.maybeSingle();

		if (xUsername && service) {
			const { data: taken } = await service
				.from('user_profiles')
				.select('glyph_user_id')
				.ilike('x_username', xUsername)
				.neq('glyph_user_id', userId)
				.maybeSingle();
			if (taken?.glyph_user_id) {
				return NextResponse.json({ error: 'That X handle is already on another Ape.' }, { status: 409 });
			}
		}

		const isNewUser = !existingProfile;
		const { error: upsertError } = await supabase.rpc('upsert_user_profile', {
			p_glyph_user_id: userId,
			p_display_name: (isNewUser || !existingProfile?.display_name) ? (displayName || null) : null,
			p_x_username: (isNewUser || !existingProfile?.x_username) ? (xUsername || null) : null,
			p_avatar_url: (isNewUser || !existingProfile?.avatar_url) ? (avatarUrl || null) : null,
		});

		if (upsertError) {
			console.error('Error upserting user profile:', upsertError.message);
			return NextResponse.json({ error: 'Could not save this profile.' }, { status: 500 });
		}

		if (isNewUser) {
			await supabase.rpc('award_achievement', {
				p_glyph_user_id: userId,
				p_achievement_code: 'first_sign_in',
			});
		}

		if (xUsername && (isNewUser || !existingProfile?.x_username)) {
			await supabase.rpc('award_achievement', {
				p_glyph_user_id: userId,
				p_achievement_code: 'link_x_account',
			});
			await supabase.rpc('progress_quest', {
				p_glyph_user_id: userId,
				p_quest_code: 'link_x_account_quest',
				p_increment: 1,
			});
		}

		return NextResponse.json({
			ok: true,
			isNewUser,
			message: isNewUser ? 'User profile created and first sign-in achievement awarded' : 'User profile updated',
		});
	} catch (error) {
		const denied = authFailure(error);
		if (denied) return denied;
		const message = error instanceof Error ? error.message : 'Unknown error';
		console.error('Error in init-user endpoint:', message);
		return NextResponse.json({ error: 'Could not save this profile.' }, { status: 500 });
	}
}

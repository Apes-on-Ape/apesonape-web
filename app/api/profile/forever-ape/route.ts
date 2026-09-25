'use server';

import { NextRequest, NextResponse } from 'next/server';
import { buildSelectedApePayloadForArcade } from '@/lib/arcade-forever-ape';
import { authFailure, requireAuthenticatedApe } from '@/lib/auth/ape';
import { normalizeWallet } from '@/lib/arcade-db';
import { ownedApeIds } from '@/lib/profile/linked-wallets';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { createNotification } from '@/lib/notifications/create';

type Payload = {
  address?: string;
  apeId?: number;
  ape_id?: number;
  /** Glyph account id — matches `user_profiles.glyph_user_id` when profile was created via Glyph */
  glyphUserId?: string;
  glyph_user_id?: string;
  /**
   * Privy user id — matches `user_profiles.glyph_user_id` when profile was created via
   * `/api/auth/init-user` (same column; different auth provider).
   */
  privyUserId?: string;
  userId?: string;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = normalizeWallet(searchParams.get('address') || '');
    /** Same as `glyph_user_id` — Privy `user.id` from init-user or Glyph `user.id` */
    const userId =
      (searchParams.get('userId') || searchParams.get('privyUserId') || searchParams.get('glyphUserId') || '')
        .trim();
    if (!address && !userId) {
      return NextResponse.json({ error: 'address or userId required' }, { status: 400 });
    }
    const svc = getSupabaseServiceClient();
    if (!svc) return NextResponse.json({ error: 'supabase missing' }, { status: 500 });

    let data: { forever_ape_id?: unknown } | null = null;

    if (address) {
      const w = await svc
        .from('user_profiles')
        .select('forever_ape_id')
        .ilike('wallet_address', address)
        .maybeSingle();
      if (w.error) return NextResponse.json({ error: w.error.message }, { status: 500 });
      data = w.data;
    }

    if (data == null && userId) {
      const u = await svc
        .from('user_profiles')
        .select('forever_ape_id')
        .eq('glyph_user_id', userId)
        .maybeSingle();
      if (u.error) return NextResponse.json({ error: u.error.message }, { status: 500 });
      data = u.data;
    }
    const raw = data?.forever_ape_id;
    const apeId = raw != null && Number.isFinite(Number(raw)) ? Number(raw) : null;
    return NextResponse.json({ apeId });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to load';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ape = await requireAuthenticatedApe(req);
    const body = (await req.json().catch(() => ({}))) as Payload;
    const rawApe = body.apeId ?? body.ape_id ?? (body as { tokenId?: number }).tokenId;
    const apeId = typeof rawApe === 'number' ? rawApe : Number(rawApe);
    if (!Number.isInteger(apeId) || apeId < 0) {
      return NextResponse.json({ error: 'Choose an Ape you hold.' }, { status: 400 });
    }
    const svc = getSupabaseServiceClient();
    if (!svc) return NextResponse.json({ error: 'supabase missing' }, { status: 500 });
    const owned = new Set(await ownedApeIds(ape.wallets));
    if (!owned.has(apeId)) {
      return NextResponse.json({ error: 'That Ape is not held by a linked wallet.' }, { status: 403 });
    }
    const glyphKey = ape.userId;
    const address = ape.primaryWallet || '';

    if (glyphKey) {
      const previous = await svc.from('user_profiles').select('forever_ape_id').eq('glyph_user_id', glyphKey).maybeSingle();
      const previousId = previous.data?.forever_ape_id != null ? Number(previous.data.forever_ape_id) : null;
      const selected_ape = await buildSelectedApePayloadForArcade(apeId);
      const patch: Record<string, unknown> = {
        forever_ape_id: apeId,
        selected_ape,
        updated_at: new Date().toISOString(),
      };
      if (address) patch.wallet_address = address;
      const { data: updated, error: upErr } = await svc
        .from('user_profiles')
        .update(patch)
        .eq('glyph_user_id', glyphKey)
        .select('glyph_user_id');
      if (upErr) {
        return NextResponse.json({ error: upErr.message }, { status: 500 });
      }
      if (updated && updated.length > 0) {
        if (!previous.error && previousId !== apeId) {
          await createNotification({
            userId: glyphKey,
            type: 'forever_ape',
            category: 'profile',
            title: 'Forever Ape updated',
            message: `Ape #${apeId} is now your Forever Ape.`,
            actionLabel: 'View Ape',
            actionUrl: `/collection/${apeId}/`,
            referenceType: 'ape',
            referenceId: String(apeId),
            dedupeKey: `forever-ape:${apeId}:${glyphKey}`,
          });
        }
        return NextResponse.json({ ok: true, apeId });
      }

      const { error: insErr } = await svc.from('user_profiles').insert({
        glyph_user_id: glyphKey,
        ...patch,
      });
      if (insErr) {
        if (/glyph_user_id/i.test(insErr.message) && /unique|duplicate/i.test(insErr.message)) {
          return NextResponse.json(
            { error: 'This account already has a profile. Sign in again and retry.' },
            { status: 409 }
          );
        }
        if (/wallet_address/i.test(insErr.message) && /unique|duplicate/i.test(insErr.message)) {
          return NextResponse.json(
            {
              error:
                'This wallet is already linked to another profile. Remove the duplicate or use the matching account.',
            },
            { status: 409 }
          );
        }
        return NextResponse.json({ error: insErr.message }, { status: 500 });
      }
      await createNotification({
        userId: glyphKey,
        type: 'forever_ape',
        category: 'profile',
        title: 'Forever Ape updated',
        message: `Ape #${apeId} is now your Forever Ape.`,
        actionLabel: 'View Ape',
        actionUrl: `/collection/${apeId}/`,
        referenceType: 'ape',
        referenceId: String(apeId),
        dedupeKey: `forever-ape:${apeId}:${glyphKey}`,
      });
      return NextResponse.json({ ok: true, apeId });
    }

    return NextResponse.json({ error: 'Sign in again so your profile exists.' }, { status: 404 });
  } catch (e: unknown) {
    const denied = authFailure(e);
    if (denied) return denied;
    const msg = e instanceof Error ? e.message : 'Failed to save';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

'use server';

import { NextRequest, NextResponse } from 'next/server';
import { buildSelectedApePayloadForArcade } from '@/lib/arcade-forever-ape';
import { resolveGlyphUserIdFromStudioWallet } from '@/lib/arcade-glyph-resolve';
import { normalizeWallet } from '@/lib/arcade-db';
import { getSupabaseServiceClient } from '@/lib/supabase';

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
    const body = (await req.json().catch(() => ({}))) as Payload;
    const address = normalizeWallet(body.address || '');
    const rawApe = body.apeId ?? body.ape_id;
    const apeId = typeof rawApe === 'number' ? rawApe : Number(rawApe);
    if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 });
    if (!Number.isFinite(apeId) || apeId < 0) {
      return NextResponse.json({ error: 'apeId must be a valid number' }, { status: 400 });
    }
    const svc = getSupabaseServiceClient();
    if (!svc) return NextResponse.json({ error: 'supabase missing' }, { status: 500 });

    const { data: byWallet, error: wErr } = await svc
      .from('user_profiles')
      .select('glyph_user_id, wallet_address')
      .ilike('wallet_address', address)
      .maybeSingle();
    if (wErr) return NextResponse.json({ error: wErr.message }, { status: 500 });

    const fromWallet = byWallet?.glyph_user_id?.trim() || '';
    const gidRaw = body.glyphUserId ?? body.glyph_user_id;
    const bodyGid = typeof gidRaw === 'string' && gidRaw.trim() ? gidRaw.trim() : '';
    const privyRaw = body.privyUserId ?? body.userId;
    const bodyPrivy = typeof privyRaw === 'string' && privyRaw.trim() ? privyRaw.trim() : '';
    /** Deferred: studio `glyphId` can differ from `user_profiles.glyph_user_id` when that column holds a Privy id. */
    const fromStudio = (await resolveGlyphUserIdFromStudioWallet(address)) || '';

    let glyphKey = '';

    if (fromWallet) {
      glyphKey = fromWallet;
    } else if (bodyPrivy) {
      /** `init-user` stores Privy `user.id` in `glyph_user_id`; `wallet_address` may still be null. */
      const { data: byPrivy, error: pErr } = await svc
        .from('user_profiles')
        .select('glyph_user_id, wallet_address')
        .eq('glyph_user_id', bodyPrivy)
        .maybeSingle();
      if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });
      if (byPrivy) {
        const rowWallet = normalizeWallet(String(byPrivy.wallet_address ?? ''));
        if (!rowWallet || rowWallet === address) {
          glyphKey = bodyPrivy;
        } else {
          return NextResponse.json(
            {
              error:
                'This site account is linked to a different wallet. Use the wallet connected to your profile.',
            },
            { status: 409 }
          );
        }
      }
    } else if (bodyGid) {
      const { data: rowForGlyph, error: gErr } = await svc
        .from('user_profiles')
        .select('glyph_user_id, wallet_address')
        .eq('glyph_user_id', bodyGid)
        .maybeSingle();
      if (gErr) return NextResponse.json({ error: gErr.message }, { status: 500 });

      if (rowForGlyph) {
        const rowWallet = normalizeWallet(String(rowForGlyph.wallet_address ?? ''));
        if (!rowWallet || rowWallet === address) {
          glyphKey = bodyGid;
        } else {
          return NextResponse.json(
            {
              error:
                'This Glyph account is already linked to a different wallet in our database. Use the wallet that matches your Glyph account.',
            },
            { status: 409 }
          );
        }
      } else {
        /** No row yet — trust client Glyph id for a first-time `user_profiles` row. */
        glyphKey = bodyGid;
      }
    } else if (fromStudio) {
      glyphKey = fromStudio;
    }

    if (glyphKey) {
      const selected_ape = await buildSelectedApePayloadForArcade(apeId);
      const { error: upErr } = await svc
        .from('user_profiles')
        .upsert(
          {
            glyph_user_id: glyphKey,
            wallet_address: address,
            forever_ape_id: apeId,
            selected_ape,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'wallet_address' }
        );
      if (upErr) {
        if (/wallet_address/i.test(upErr.message) && /unique|duplicate/i.test(upErr.message)) {
          return NextResponse.json(
            {
              error:
                'This wallet is already linked to another profile. Remove the duplicate or use the matching account.',
            },
            { status: 409 }
          );
        }
        return NextResponse.json({ error: upErr.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true, apeId });
    }

    return NextResponse.json(
      {
        error:
          'No profile matched this wallet. Sign in (Glyph + X) so init-user creates your profile, then try again — or pass privyUserId (Privy) and/or glyphUserId (Glyph) in the request body.',
      },
      { status: 400 }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to save';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

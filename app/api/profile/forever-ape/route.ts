'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';

type Payload = {
	address?: string;
	apeId?: number;
};

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const address = (searchParams.get('address') || '').toLowerCase();
		if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 });
		const svc = getSupabaseServiceClient();
		if (!svc) return NextResponse.json({ error: 'supabase missing' }, { status: 500 });
		const { data, error } = await svc
			.from('studio_forever_ape')
			.select('*')
			.eq('address', address)
			.limit(1)
			.maybeSingle();
		if (error) return NextResponse.json({ error: error.message }, { status: 500 });
		return NextResponse.json({ apeId: data?.ape_id ?? null });
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : 'Failed to load';
		return NextResponse.json({ error: msg }, { status: 500 });
	}
}

export async function POST(req: NextRequest) {
	try {
		const body = (await req.json().catch(() => ({}))) as Payload;
		const address = (body.address || '').toLowerCase();
		const apeId = typeof body.apeId === 'number' ? body.apeId : Number(body.apeId);
		if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 });
		if (!Number.isFinite(apeId) || apeId < 0) {
			return NextResponse.json({ error: 'apeId must be a positive number' }, { status: 400 });
		}
		const svc = getSupabaseServiceClient();
		if (!svc) return NextResponse.json({ error: 'supabase missing' }, { status: 500 });
		const { error } = await svc
			.from('studio_forever_ape')
			.upsert({ address, ape_id: apeId }, { onConflict: 'address' });
		if (error) return NextResponse.json({ error: error.message }, { status: 500 });
		return NextResponse.json({ ok: true, apeId });
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : 'Failed to save';
		return NextResponse.json({ error: msg }, { status: 500 });
	}
}


'use server';

import { NextRequest, NextResponse } from 'next/server';
import { deleteCreation, getCreation } from '@/lib/studio/persistence';

export async function GET(
	_req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const creation = await getCreation(id);
		if (!creation) {
			return NextResponse.json({ error: 'Not found' }, { status: 404 });
		}
		return NextResponse.json(creation, {
			headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=15' },
		});
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : 'Failed to load';
		return NextResponse.json({ error: msg }, { status: 500 });
	}
}

export async function DELETE(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const creation = await getCreation(id);
		if (!creation) return NextResponse.json({ error: 'Not found' }, { status: 404 });

		const body = (await req.json().catch(() => ({}))) as {
			creatorAddress?: string;
			glyphId?: string;
			handle?: string;
		};
		const requesterAddr = (body.creatorAddress || '').toLowerCase();
		const requesterGlyph = body.glyphId || '';
		const requesterHandle = (body.handle || '').toLowerCase();

		const creationAddr = (creation.creatorAddress || '').toLowerCase();
		const creationGlyph = creation.glyphProfile?.glyphId || '';

		// Admin override: ApeProfessore can delete any creation
		if (requesterHandle === 'apeprofessore') {
			const ok = await deleteCreation(id);
			if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
			return NextResponse.json({ ok: true, admin: true });
		}

		if (!requesterAddr || requesterAddr !== creationAddr) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}
		// If creation stored glyphId, require match as an extra check
		if (creationGlyph && requesterGlyph && creationGlyph !== requesterGlyph) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}

		const ok = await deleteCreation(id);
		if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
		return NextResponse.json({ ok: true });
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : 'Failed to delete';
		return NextResponse.json({ error: msg }, { status: 500 });
	}
}


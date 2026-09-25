'use server';

import { NextRequest, NextResponse } from 'next/server';
import { authFailure, creationOwnedBy, requireAuthenticatedApe } from '@/lib/auth/ape';
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
		const ape = await requireAuthenticatedApe(req);
		const { id } = await params;
		const creation = await getCreation(id);
		if (!creation) return NextResponse.json({ error: 'Not found' }, { status: 404 });
		if (!creationOwnedBy(ape, creation)) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}

		const ok = await deleteCreation(id);
		if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
		return NextResponse.json({ ok: true });
	} catch (e: unknown) {
		const denied = authFailure(e);
		if (denied) return denied;
		const msg = e instanceof Error ? e.message : 'Failed to delete';
		return NextResponse.json({ error: msg }, { status: 500 });
	}
}


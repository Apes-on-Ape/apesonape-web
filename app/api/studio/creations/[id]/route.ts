'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getCreation } from '@/lib/studio/persistence';

export async function GET(
	_req: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const creation = await getCreation(params.id);
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


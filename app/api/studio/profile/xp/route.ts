'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getCreatorSkills } from '@/lib/studio/xp';

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const address = searchParams.get('address') || '';
		const skills = await getCreatorSkills(address);
		return NextResponse.json({ skills });
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : 'Failed to load xp';
		return NextResponse.json({ error: msg }, { status: 500 });
	}
}


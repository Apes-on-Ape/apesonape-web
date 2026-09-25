import { NextResponse } from 'next/server';

/** Remix generation is retired. Historical creations stay in place. */
export async function POST() {
	return NextResponse.json({ error: 'Studio remixing is no longer supported.' }, { status: 400 });
}

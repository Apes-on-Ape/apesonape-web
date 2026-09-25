import { NextResponse } from 'next/server';

/** Closed. This route used to read profiles and award achievements with no auth. */
export function GET() {
	return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export function POST() {
	return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

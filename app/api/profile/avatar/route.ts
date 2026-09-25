import { NextResponse } from 'next/server';

/** Owned-Ape avatars are chosen in Profile Settings. This upload path is closed. */
export async function POST() {
	return NextResponse.json(
		{ error: 'Profile avatars use an owned Ape. Image upload is not available.' },
		{ status: 400 },
	);
}

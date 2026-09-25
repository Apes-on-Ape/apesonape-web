import { retiredRoute } from '@/lib/auth/ape';

/** Closed. Profile achievements unlock from server-side criteria, not this request. */
export function POST() {
	return retiredRoute();
}

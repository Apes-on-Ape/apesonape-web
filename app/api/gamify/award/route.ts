import { retiredRoute } from '@/lib/auth/ape';

/** Closed. Achievements are evaluated from stored activity, not a client unlock request. */
export function POST() {
	return retiredRoute();
}

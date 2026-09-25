import { retiredRoute } from '@/lib/auth/ape';

/** Closed. Quest progress is no longer accepted from the client. */
export function POST() {
	return retiredRoute();
}

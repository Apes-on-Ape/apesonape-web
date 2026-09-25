import { retiredRoute } from '@/lib/auth/ape';

/** Clubroom is closed. Usernames are not accepted from the client. */
export function POST() {
	return retiredRoute();
}

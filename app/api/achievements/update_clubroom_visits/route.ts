import { retiredRoute } from '@/lib/auth/ape';

/** Legacy clubroom counter. The client chose the wallet and the count. */
export function POST() {
	return retiredRoute();
}

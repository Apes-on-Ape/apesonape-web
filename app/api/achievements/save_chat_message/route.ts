import { retiredRoute } from '@/lib/auth/ape';

/** Legacy chat counter. The client chose the wallet and the count. */
export function POST() {
	return retiredRoute();
}

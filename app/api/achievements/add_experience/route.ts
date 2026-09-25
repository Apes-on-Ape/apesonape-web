import { retiredRoute } from '@/lib/auth/ape';

/** Closed. Arcade XP and arcade level are not part of AOA progression. */
export function POST() {
	return retiredRoute();
}

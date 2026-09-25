import 'server-only';
import { apeThumb } from '@/lib/profile/avatar';
import { profileHref } from '@/lib/profile/identity';
import { getSupabaseServiceClient } from '@/lib/supabase';

const EVM = /^0x[a-f0-9]{40}$/;

export type CreatorCard = {
	label: string;
	profileHref: string | null;
	avatarUrl: string | null;
};

type Person = {
	displayName: string;
	handle: string | null;
	foreverApeId: number | null;
};

function shortWallet(address: string) {
	return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function readPerson(row: { display_name?: string | null; x_username?: string | null; forever_ape_id?: number | null }): Person {
	const forever = row.forever_ape_id != null ? Number(row.forever_ape_id) : null;
	return {
		displayName: String(row.display_name ?? '').trim(),
		handle: String(row.x_username ?? '').replace(/^@/, '').trim() || null,
		foreverApeId: forever != null && Number.isFinite(forever) ? forever : null,
	};
}

function mergePerson(current: Person | undefined, next: Person): Person {
	return {
		displayName: next.displayName || current?.displayName || '',
		handle: next.handle || current?.handle || null,
		foreverApeId: next.foreverApeId ?? current?.foreverApeId ?? null,
	};
}

/** Display name, Forever Ape image, and public profile path for creator wallets. */
export async function creatorCards(addresses: string[], glyphByAddress: Map<string, string>) {
	const cards = new Map<string, CreatorCard>();
	const safe = [...new Set(addresses.map((address) => address.toLowerCase()).filter((address) => EVM.test(address)))];
	for (const address of safe) {
		cards.set(address, { label: shortWallet(address), profileHref: null, avatarUrl: null });
	}
	const supabase = getSupabaseServiceClient();
	if (!supabase || safe.length === 0) return cards;

	const people = new Map<string, Person>();
	const remember = (userId: string | null | undefined, row: Parameters<typeof readPerson>[0]) => {
		const id = String(userId ?? '').trim();
		if (!id) return;
		people.set(id, mergePerson(people.get(id), readPerson(row)));
	};

	const { data: byWallet } = await supabase
		.from('user_profiles')
		.select('wallet_address, display_name, x_username, forever_ape_id, glyph_user_id')
		.or(safe.map((address) => `wallet_address.ilike.${address}`).join(','));
	const userByPrimary = new Map<string, string>();
	for (const row of byWallet ?? []) {
		remember(row.glyph_user_id, row);
		const address = String(row.wallet_address ?? '').toLowerCase();
		const userId = String(row.glyph_user_id ?? '').trim();
		if (address && userId) userByPrimary.set(address, userId);
	}

	const glyphIds = [...new Set([...glyphByAddress.values()].map((id) => id.trim()).filter(Boolean))];
	const missingGlyphs = glyphIds.filter((id) => !people.has(id));
	if (missingGlyphs.length) {
		const { data: byGlyph } = await supabase
			.from('user_profiles')
			.select('glyph_user_id, display_name, x_username, forever_ape_id')
			.in('glyph_user_id', missingGlyphs);
		for (const row of byGlyph ?? []) remember(row.glyph_user_id, row);
	}

	const userByAlias = new Map<string, string>();
	const aliasByAddress = new Map<string, string>();
	const aliasQuery = await supabase
		.from('user_wallet_aliases')
		.select('wallet_address_normalized, alias, user_id')
		.in('wallet_address_normalized', safe);
	if (!aliasQuery.error) {
		for (const row of aliasQuery.data ?? []) {
			const address = String(row.wallet_address_normalized ?? '').toLowerCase();
			const alias = String(row.alias ?? '').trim();
			const userId = String(row.user_id ?? '').trim();
			if (address && alias) aliasByAddress.set(address, alias);
			if (address && userId) userByAlias.set(address, userId);
		}
		const missingUsers = [...new Set([...userByAlias.values()].filter((id) => !people.has(id)))];
		if (missingUsers.length) {
			const { data: byUser } = await supabase
				.from('user_profiles')
				.select('glyph_user_id, display_name, x_username, forever_ape_id')
				.in('glyph_user_id', missingUsers);
			for (const row of byUser ?? []) remember(row.glyph_user_id, row);
		}
	}

	for (const address of safe) {
		const person = people.get(userByPrimary.get(address) || '')
			|| people.get(glyphByAddress.get(address) || '')
			|| people.get(userByAlias.get(address) || '');
		const label = person?.displayName || aliasByAddress.get(address) || shortWallet(address);
		cards.set(address, {
			label,
			profileHref: profileHref(person?.handle),
			avatarUrl: person?.foreverApeId != null ? apeThumb(person.foreverApeId) : null,
		});
	}

	return cards;
}

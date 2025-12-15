import { SUPABASE_URL } from './constants';

export function getSupabaseFunctionsBase(): string {
	try {
		const u = new URL(SUPABASE_URL);
		// example host: bqcrbcpmimfojnjdhvrz.supabase.co -> bqcrbcpmimfojnjdhvrz.functions.supabase.co
		const [projectRef] = u.host.split('.');
		return `https://${projectRef}.functions.supabase.co`;
	} catch {
		return '';
	}
}



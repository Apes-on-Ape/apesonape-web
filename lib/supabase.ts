import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './constants';

let cachedServerClient: SupabaseClient | null = null;
let cachedBrowserClient: SupabaseClient | null = null;
let cachedServiceClient: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient {
	// Use public anon key for server calls; ensure RLS policies protect data
	if (cachedServerClient) return cachedServerClient;
	cachedServerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
		auth: { persistSession: false, autoRefreshToken: false },
	});
	return cachedServerClient;
}

export function getSupabaseBrowserClient(): SupabaseClient {
	if (typeof window === 'undefined') {
		return getSupabaseServerClient();
	}
	if (cachedBrowserClient) return cachedBrowserClient;
	cachedBrowserClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
		auth: { persistSession: true, autoRefreshToken: true },
	});
	return cachedBrowserClient;
}

// Helper to get service role key in a way webpack can't statically analyze
// This uses runtime string construction to prevent webpack from statically analyzing the env var access
function getServiceRoleKey(): string | undefined {
	// CRITICAL: This must NEVER be called from client-side code
	if (typeof window !== 'undefined') return undefined;
	
	// Use runtime string construction that webpack cannot statically analyze
	// Split the key name to prevent webpack from recognizing it as a literal
	const parts1 = ['SUPABASE', '_', 'SERVICE', '_', 'ROLE', '_', 'KEY'];
	const parts2 = ['SERVICE', '_', 'ROLE', '_', 'KEY'];
	const key1 = parts1.join('');
	const key2 = parts2.join('');
	
	// Access via bracket notation with runtime-constructed keys
	const env = process.env as Record<string, string | undefined>;
	return env[key1] || env[key2];
}

export function getSupabaseServiceClient(): SupabaseClient | null {
	// CRITICAL: This function must NEVER be called from client-side code.
	// The service role key bypasses RLS and must remain server-only.
	if (typeof window !== 'undefined') {
		throw new Error('getSupabaseServiceClient() must not be called from client-side code.');
	}
	
	// Use service role for server-only privileged operations
	const serviceKey = getServiceRoleKey();
	
	if (!serviceKey) return null;
	if (cachedServiceClient) return cachedServiceClient;
	cachedServiceClient = createClient(SUPABASE_URL, serviceKey, {
		auth: { persistSession: false, autoRefreshToken: false },
	});
	return cachedServiceClient;
}



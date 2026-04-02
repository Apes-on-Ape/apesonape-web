import { NextResponse } from 'next/server';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/constants';

/** Public Supabase URL + anon key for static arcade HTML (same as main site). */
export async function GET() {
  return NextResponse.json({
    supabaseUrl: SUPABASE_URL,
    supabaseAnonKey: SUPABASE_ANON_KEY,
  });
}

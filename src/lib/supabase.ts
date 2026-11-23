import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;

function readSupabaseEnv(): { url: string; anonKey: string } {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();
  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = readSupabaseEnv();
  return (
    url.length > 0 &&
    anonKey.length > 0 &&
    !url.includes('tu-proyecto.supabase.co') &&
    !anonKey.includes('tu-anon-key')
  );
}

/**
 * Devuelve un cliente singleton de Supabase o `null` si las variables de entorno
 * todavía no están configuradas. Esto garantiza que `npm run build` nunca falle
 * por ausencia de `.env.local` en entornos CI/CD o antes de conectar Supabase.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!cachedClient) {
    const { url, anonKey } = readSupabaseEnv();
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return cachedClient;
}

export function resetSupabaseClientCache(): void {
  cachedClient = null;
}

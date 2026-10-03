import { PostgrestClient } from '@supabase/postgrest-js';
import { FunctionsClient } from '@supabase/functions-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// The full supabase-js client ships auth, realtime and storage, none of which
// this site uses. Composing the two underlying clients keeps the bundle small
// while exposing the same REST / Edge Function APIs the callers rely on.
// Headers mirror supabase-js (apikey + Bearer) so existing policies apply.
const requestHeaders = { apikey: key, Authorization: `Bearer ${key}` };

const postgrestClient = url && key
    ? new PostgrestClient(`${url}/rest/v1`, { headers: requestHeaders })
    : null;
const functionsClient = url && key
    ? new FunctionsClient(`${url}/functions/v1`, { headers: requestHeaders })
    : null;

// If the env vars are not set, export null so callers can no-op gracefully
// instead of throwing at module load time.
export const supabase = url && key
    ? {
          from: (table) => postgrestClient.from(table),
          functions: {
              invoke: (functionName, options) => functionsClient.invoke(functionName, options),
          },
      }
    : null;

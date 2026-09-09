// Copy this file to `supabase-config.js` and fill in your own project's values
// from Supabase → Project Settings → API.
//
//   cp public/supabase-config.example.js public/supabase-config.js
//
// Use the "anon" / "publishable" key, never the secret service key. The anon key
// is safe to commit and ship in the browser *only* once the row-level-security
// policies in supabase/schema.sql have been applied — that is what isolates each
// user's data.
export const SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co';
export const SUPABASE_ANON_KEY = 'YOUR-ANON-KEY';

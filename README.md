# Simple Ledger

A dependency-free, mobile-first debt and credit manager. It uses Supabase Auth and Postgres, and can be deployed as static files to Cloudflare Pages.

## Set up Supabase

1. Create a free Supabase project, then run [`supabase/schema.sql`](supabase/schema.sql) in its SQL Editor.
2. In Authentication settings, configure your Cloudflare Pages URL as a redirect URL. Email/password sign-in is enabled by default.
3. Copy `supabase-config.js` and replace the two placeholders using values from Project Settings → API. Do not use the service-role key.

## Deploy to Cloudflare Pages

Create a new Pages project using this folder as the build output directory. There is no build command: this is a static site. After the first deploy, add the Pages domain to Supabase Authentication redirect URLs.

The app is installable from Chrome on Android after it is served over HTTPS. The service worker caches the application shell; user data always remains online in Supabase in this MVP.

## Bookkeeping rule

**Debit** increases the amount a contact owes you. **Credit** decreases it. A negative balance means you owe that contact. Balances are calculated from transactions, never stored on a contact.

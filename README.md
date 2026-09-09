# Simple Ledger

A dependency-free, mobile-first debt and credit manager. It uses Supabase Auth and Postgres, and deploys as static files to Cloudflare Workers.

The static site lives in [`public/`](public/). Everything outside that folder (this README, `supabase/`, build config) is never served.

## Set up Supabase

1. Create a free Supabase project, then run [`supabase/schema.sql`](supabase/schema.sql) in its SQL Editor.
2. In Authentication settings, configure your Cloudflare Pages URL as a redirect URL. Email/password sign-in is enabled by default.
3. Copy `supabase-config.js` and replace the two placeholders using values from Project Settings → API. Do not use the service-role key.

## Deploy to Cloudflare

Connected to GitHub via Cloudflare Workers Builds. On every push to `main`, Cloudflare runs `npx wrangler deploy`, which uploads the contents of `public/` as static assets to the Worker named `mydebt` (see [`wrangler.jsonc`](wrangler.jsonc)). There is no build step.

Deploy manually with `npm run deploy` (needs `wrangler login` or a `CLOUDFLARE_API_TOKEN`). After the first deploy, add the Worker domain to Supabase Authentication redirect URLs.

The app is installable from Chrome on Android after it is served over HTTPS. The service worker caches the application shell; user data always remains online in Supabase in this MVP.

## Bookkeeping rule

**Debit** increases the amount a contact owes you. **Credit** decreases it. A negative balance means you owe that contact. Balances are calculated from transactions, never stored on a contact.

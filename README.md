# MyDebt

[![CI](https://github.com/moutmani01/MyDebt/actions/workflows/ci.yml/badge.svg)](https://github.com/moutmani01/MyDebt/actions/workflows/ci.yml)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![No build step](https://img.shields.io/badge/build-none-brightgreen)](#local-development)

**MyDebt** is a dependency-free, mobile-first debt and credit manager — a private
notebook for who owes what. It uses Supabase for auth and storage and deploys as
static files to Cloudflare Workers.

- **No build step, no framework.** One HTML file, one stylesheet, one compact
  `app.js` (~25 KB). The only runtime dependency is the Supabase JS client,
  loaded from a CDN at runtime.
- **Installable PWA.** Works from the home screen on Android/iOS once served over
  HTTPS. The service worker caches the app shell; your data always lives online
  in Supabase.
- **Your data is yours.** Every row is scoped to your user id by Postgres
  row-level security. The publishable anon key in `supabase-config.js` cannot
  read or write anyone else's data.

**Live:** <https://mydebt.mahfoudoutmani0.workers.dev>

---

## Contents

- [How the ledger works](#how-the-ledger-works)
- [Features](#features)
- [Currency](#currency)
- [Project layout](#project-layout)
- [Set up Supabase](#set-up-supabase)
- [Deploy to Cloudflare](#deploy-to-cloudflare)
- [Local development](#local-development)
- [CSV import](#csv-import)
- [PDF export](#pdf-export)
- [Data model](#data-model)
- [Security notes](#security-notes)
- [Known limitations & roadmap](#known-limitations--roadmap)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

---

## How the ledger works

Every contact has a running **balance** that is computed from their transactions —
it is never stored on the contact.

| Transaction type | Effect on balance | Plain meaning |
|---|---|---|
| **debit**  | balance goes **up**   | they owe you more (you lent, you invoiced) |
| **credit** | balance goes **down** | they paid you back, or you now owe them |

- **Positive balance** → *they owe you*.
- **Negative balance** → *you owe them*.
- **Zero** → *settled up*.

Amounts are always positive numbers; the direction comes from the type. Every
amount is labelled with the **currency you choose when you create your account**
(see [Currency](#currency)). It is a display label only — no conversion happens.

---

## Features

- Email/password accounts (Supabase Auth), with a [currency](#currency) chosen at
  sign-up.
- Contacts, tagged **person** or **company**, with optional phone, email, notes.
- Add / edit / delete transactions (debit or credit, dated, with a note).
- Delete a contact — their transactions are removed with them.
- Home screen: net balance, total owed to you, total you owe, recent activity.
- Search and filter contacts.
- **[Export a contact's statement as PDF](#pdf-export).**
- **[Import history from CSV](#csv-import)** — per contact, or a whole migration
  in one file. Strictly validated; a preview/confirm step before anything is
  written.
- Offline-tolerant: the app shell is cached, so it opens without a connection
  (data operations still need the network).

---

## Currency

When you **create an account** you pick a currency from a short list of the ten
most-traded ones:

`USD` · `EUR` · `GBP` · `JPY` · `CNY` · `CAD` · `AUD` · `CHF` · `INR` · `MAD`

- It is stored on your Supabase user as `user_metadata.currency` — no extra table,
  no schema change.
- It is a **label only**. Every amount in the app and in exported PDFs is suffixed
  with the code (`1,250.00 EUR`). There is no exchange-rate conversion; don't mix
  currencies in one account.
- **There is no in-app switch yet.** Changing it means
  `supabase.auth.updateUser({ data: { currency: 'XYZ' } })` or editing the user in
  the Supabase dashboard.
- **Fallback is `MAD`.** Any account without the field set — including every
  account created before this feature, such as `mahfoudoutmani0@gmail.com` — shows
  amounts in MAD.

---

## Project layout

```
public/                 ← the entire deployed site
  index.html
  app.js                ← all application logic
  styles.css
  sw.js                 ← service worker (network-first, versioned cache)
  manifest.webmanifest
  supabase-config.js    ← your project URL + anon key
  icons/icon.svg
supabase/
  schema.sql            ← run once in the Supabase SQL editor
wrangler.jsonc          ← Cloudflare Worker config (name + assets dir)
package.json            ← only dev dependency is wrangler
```

Anything outside `public/` is never served.

---

## Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** and run [`supabase/schema.sql`](supabase/schema.sql).
   This creates the `contacts` and `transactions` tables, their indexes, and the
   row-level-security policies. **The app is not safe to expose until this has
   run** — RLS is what isolates each user's data.
3. In **Project Settings → API**, copy the **Project URL** and the
   **anon / publishable** key (never the `service_role` key).
4. Put them in [`public/supabase-config.js`](public/supabase-config.js):

   ```js
   export const SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co';
   export const SUPABASE_ANON_KEY = 'eyJ...';
   ```

5. In **Authentication → URL Configuration**, set:
   - **Site URL** → your deployed URL (e.g. `https://mydebt.<subdomain>.workers.dev`)
   - **Redirect URLs** → add `https://mydebt.<subdomain>.workers.dev/**`

   Without this, the confirmation link in sign-up emails points at the wrong
   place. Plain email/password sign-in works without it.

No profile table is needed for [currency](#currency) — the sign-up form writes it
to the user's `user_metadata`.

---

## Deploy to Cloudflare

The repo is connected to **Cloudflare Workers Builds**. On every push to `main`:

1. Cloudflare clones the repo and runs `bun install` (installs `wrangler`).
2. It runs `npx wrangler deploy`.
3. `wrangler` uploads everything in `public/` as static assets to the Worker
   named **`mydebt`** (set in [`wrangler.jsonc`](wrangler.jsonc)).

There is **no build command**. The site is live at the Worker's `*.workers.dev`
URL (or your custom domain) within a minute.

> **Why `public/` and not the repo root?** `wrangler deploy` uploads its whole
> assets directory. If that were `.`, it would try to upload `node_modules/`
> (including a 146 MiB `workerd` binary from the CI install) and fail the 25 MiB
> per-asset limit. Keeping the site in `public/` keeps build artifacts out.

### Manual deploy

```bash
npm run deploy
```

Needs Cloudflare credentials — either `npx wrangler login` once, or a
`CLOUDFLARE_API_TOKEN` environment variable with the *Edit Workers* permission.
This reads the same `wrangler.jsonc`, so it targets the same `mydebt` Worker.

### Redeploy without a code change

- **Dashboard:** Workers & Pages → `mydebt` → Deployments → **Retry** the latest,
  or open an older version and **Rollback**.
- **CLI:** `npm run deploy` again.

---

## Local development

```bash
cp public/supabase-config.example.js public/supabase-config.js   # first time only
npm install
npm run dev          # = wrangler dev, serves public/ on http://localhost:8787
npm run check        # node --check on the JS
```

`wrangler dev` serves `public/` exactly as Cloudflare will. Point
`supabase-config.js` at your own (or a throwaway) Supabase project — there is no
local database. The service worker is not exercised under `wrangler dev`; test
PWA/offline/update behaviour against a real HTTPS deploy.

Edit `public/app.js` / `public/styles.css` directly; there is nothing to compile.

### Caching & updates

`public/sw.js` is **stale-while-revalidate**: pages load instantly from cache
while the shell is refreshed in the background. Every ~60 seconds (and whenever a
tab becomes visible) the page asks the worker to compare the deployed
`app.js` / `index.html` / `styles.css` against the cache; if they differ it shows
a **"New version available — tap to update"** bar. A worker that changes its own
code reloads open tabs automatically.

When you change any cached shell file, bump the cache name so old caches are
dropped on activate:

```js
const CACHE = 'mydebt-v6';   // was v5
```

---

## CSV import

Two entry points, both in the app:

| Where | Button | Header row | Scope |
|---|---|---|---|
| A contact's page | **⇪ Import CSV** | `date,type,amount,note` | that one contact |
| Contacts list    | **⇪ Import full history from CSV** | `contact,date,type,amount,note` | any number of contacts |

### Rules (identical for both)

- The **first line must be exactly** the header shown above — same columns, same
  order, lower-case. Nothing is imported if it doesn't match.
- **`date`** — `YYYY-MM-DD`, and a real calendar date (`2024-02-30` is rejected).
- **`type`** — `debit` or `credit` (case-insensitive).
- **`amount`** — a positive number, **max 2 decimal places**. No currency symbol.
  Thousands separators and either decimal mark are accepted and normalised:
  `1250`, `1,250.00`, `1.250,00`, `1 250,00` all mean `1250.00`.
- **`note`** — optional, up to 500 characters. If it contains a comma, wrap the
  field in `"double quotes"`. Quotes, `\r\n` line endings and a leading BOM
  (what Excel writes) are all handled.
- **`contact`** (full-history file only) — matched to an existing contact by name,
  case-insensitively. A name with no match is **created as a `person`** (you can
  change the type afterwards). Empty names are rejected.
- Up to **1000 rows** per file.

### All-or-nothing

The file is fully parsed and validated **in the browser before any database
call**. If a single row is wrong, the import stops and shows you the offending
line numbers and reasons — **the database is not touched**.

If everything is valid you get a **confirmation prompt** first:

- *per contact* — how many rows, total debits, total credits, and the balance
  before → after.
- *full history* — how many rows, how many existing contacts matched, and the
  names of any contacts that will be created.

Only after you confirm are the rows inserted (in a single statement, so it is all
or nothing at the database too).

### Examples

**Per contact** — `date,type,amount,note`

```csv
date,type,amount,note
2024-01-15,debit,500,Lent cash for rent
2024-02-03,credit,200.50,"Repayment, first part"
2024-03-20,debit,75,Taxi fare
```

**Full history** — `contact,date,type,amount,note`

```csv
contact,date,type,amount,note
Ahmed Benali,2024-01-15,debit,500,Lent cash for rent
Ahmed Benali,2024-02-03,credit,200.50,"Repayment, first part"
ACME Ltd,2024-03-01,debit,"1,250.00",Invoice #42
```

Both import modals have a **"Download this as a template"** link that gives you
the matching header + example rows as a `.csv`.

### Notes & caveats

- **Imports are not de-duplicated.** Running the same file twice inserts the rows
  twice. The confirmation step is your checkpoint — read it.
- There is no bulk *undo*. To reverse an import you delete the transactions (or
  the contact) by hand.
- For the full-history file, contacts are created first. If the transaction
  insert then fails (e.g. connection drop), the new contacts remain and the error
  message says so; re-running with the contacts now existing is safe for the
  contacts but will duplicate any rows that did get in.

---

## PDF export

On a contact's page, **⤓ Export PDF** opens a clean one-page statement in a new
tab and triggers the browser's print dialog — choose **"Save as PDF"** (or print
on paper). The statement lists every transaction oldest-first with a **running
balance** column, plus the current balance and status in the header.

It uses the browser's own print-to-PDF, so there is no library and no file is
downloaded automatically. If a pop-up blocker stops the new tab, the app tells
you to allow pop-ups for the site.

There is currently **no CSV export**; see the roadmap.

---

## Data model

`supabase/schema.sql`, abbreviated:

```sql
contacts(
  id uuid pk,
  user_id uuid  → auth.users, default auth.uid(),
  name text not null,
  type text check (type in ('person','company')) default 'person',
  phone text, email text, notes text,
  created_at timestamptz
)

transactions(
  id uuid pk,
  user_id uuid  → auth.users, default auth.uid(),
  contact_id uuid → contacts on delete cascade,
  type text check (type in ('debit','credit')),
  amount numeric(12,2) check (amount > 0),
  date date default current_date,
  note text,
  created_at timestamptz
)
```

- Deleting a contact cascades to their transactions.
- Both tables have `enable row level security` with a single policy: a row is
  visible and writable only when `auth.uid() = user_id`.
- Balances are derived on the client; there is no stored balance to keep in sync.

---

## Security notes

- The **anon / publishable key is meant to be public** — it is shipped in
  `supabase-config.js` and visible in the browser. It is only safe *because* RLS
  is enabled. Never commit the `service_role` key.
- Text rendered into the DOM is HTML-escaped (`escape()` in `app.js`). The
  generated PDF escapes contact names and notes too.
- This repository is public. Keep secrets (service-role keys, Cloudflare API
  tokens) out of it — use Cloudflare's build environment variables or your local
  `wrangler` login instead.

---

## Known limitations & roadmap

Current limitations:

- One currency per account, chosen at sign-up, with no in-app way to change it
  and no conversion between currencies.
- Online-only for data — no offline queue; edits fail without a connection.
- No CSV/JSON **export** (import only).
- No de-duplication on import.
- No "mark as settled" / archiving; settled contacts stay in the list.
- Sign-up requires email confirmation as configured in Supabase.

Possible next steps:

- **Export CSV** (per contact and full) — pairs with import and doubles as a
  backup; small change.
- Per-import undo, or tagging imported rows so a batch can be removed.
- A settings screen to change your account currency after sign-up.
- Offline write queue that syncs on reconnect.
- PNG app icons for nicer installs on iOS.

---

## Contributing

Issues and pull requests are welcome. Please read
[CONTRIBUTING.md](CONTRIBUTING.md) first — the short version: keep it
dependency-free and no-build, one change per PR, run `npm run check`, and bump
the `sw.js` cache name if you touch a cached file. By participating you agree to
the [Code of Conduct](CODE_OF_CONDUCT.md).

## Security

Found a vulnerability? Please report it privately — see
[SECURITY.md](SECURITY.md). Do not open a public issue.

## License

[Apache License 2.0](LICENSE) © MyDebt contributors.

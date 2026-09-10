# Contributing to Tabs

Thanks for taking the time to contribute! This is a small, deliberately
low-tech project — no framework, no build step, no transpiler. Please keep it
that way unless there's a strong reason not to.

## Ground rules

- Be respectful. This project follows the
  [Contributor Covenant](CODE_OF_CONDUCT.md).
- One logical change per pull request. Small PRs get reviewed faster.
- Discuss anything large in an issue first.

## Getting set up

You need [Node.js](https://nodejs.org) 22+ (Wrangler's minimum) and a free
[Supabase](https://supabase.com) project.

```bash
git clone https://github.com/moutmani01/MyDebt.git
cd MyDebt
npm install

# create your own config
cp public/supabase-config.example.js public/supabase-config.js
#   → edit it with your Supabase URL + anon key

# apply the schema: paste supabase/schema.sql into the Supabase SQL editor

npm run dev      # serves public/ on http://localhost:8787 via wrangler
```

There is no database locally — `wrangler dev` only serves the static files; the
app talks to your real Supabase project.

## Project shape

| Path | What |
|---|---|
| `public/app.js` | the whole app — state, rendering, event handlers, Supabase calls |
| `public/styles.css` | one stylesheet, mobile-first, CSS custom properties for theming |
| `public/sw.js` | service worker: stale-while-revalidate + update notification |
| `public/index.html` | shell (loads `app.js` as a module) |
| `supabase/schema.sql` | tables, indexes, row-level-security policies |
| `wrangler.jsonc` | Cloudflare Worker name + assets directory |

`public/app.js` is intentionally terse (template-string rendering, delegated
event handlers). Match the surrounding style rather than introducing a new one.

## Before you open a PR

```bash
npm run check     # node --check on app.js and sw.js
```

- Test the happy path **and** at least one failure path in the browser against a
  real Supabase project.
- Escape any user-supplied string that reaches the DOM — use the `escape()`
  helper in `app.js`.
- If you touch anything in the cached shell (`app.js`, `index.html`,
  `styles.css`, `sw.js`), bump `CACHE` in `public/sw.js`
  (`tabs-vN` → `vN+1`).
- Update `README.md` if you change behaviour, the CSV format, or setup steps.

## Commit messages

Short imperative subject line, a blank line, then a paragraph explaining the
*why*. Reference issues with `Fixes #123`.

## Ideas / roadmap

See the [Known limitations & roadmap](README.md#known-limitations--roadmap)
section of the README for things that would be welcome.

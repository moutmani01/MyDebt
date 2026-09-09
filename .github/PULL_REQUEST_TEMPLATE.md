<!-- Keep PRs focused: one logical change each. -->

## What & why

<!-- What does this change, and what problem does it solve? Link issues: Fixes #… -->

## How to test

<!-- Steps a reviewer can follow against a real Supabase project. -->

## Checklist

- [ ] `npm run check` passes
- [ ] Tested a happy path and at least one failure path in the browser
- [ ] User-supplied strings that reach the DOM go through `escape()`
- [ ] Bumped `CACHE` in `public/sw.js` if a cached shell file changed
- [ ] Updated `README.md` if behaviour, the CSV format, or setup changed
- [ ] No new runtime dependency / build step (or explained why it's needed)

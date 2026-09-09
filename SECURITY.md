# Security Policy

## Supported versions

This project is a single deployed app; only the latest `main` is supported.

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Report privately through GitHub:
[**Report a vulnerability**](https://github.com/moutmani01/MyDebt/security/advisories/new).

Include what you can:

- what the issue is and where (file / endpoint / flow),
- steps to reproduce or a proof of concept,
- the impact you think it has.

You can expect an acknowledgement within a few days. Please give a reasonable
window to fix before any public disclosure.

## Notes on this project's model

- The Supabase **anon / publishable key** is intentionally shipped in the client
  (`public/supabase-config.js`). It is only safe because
  [`supabase/schema.sql`](supabase/schema.sql) enables row-level security so a
  row is readable/writable only by its owner. **A misconfigured or un-applied
  RLS policy is a vulnerability** — reports about that are in scope.
- The `service_role` key must never appear in this repo or the client.
- Deploy credentials (Cloudflare API tokens) belong in the CI environment, not
  in the repository.
- User-supplied text is HTML-escaped before it reaches the DOM; a bypass of that
  (`escape()` in `app.js`, or the PDF export) is in scope.

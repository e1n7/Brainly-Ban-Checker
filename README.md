# Content Checker

An independent Next.js app for comparing draft text with selected regional reference lists. It is not affiliated with or endorsed by Brainly, and its results are informational rather than moderation decisions.

## How it works

The browser sends the entered text and selected country code to the Supabase `analyze-content` Edge Function. The function reads the private `ban_words` table server-side, evaluates its regex patterns, and returns matched text, occurrence counts, and an escaped highlighted preview. The complete word list is not sent to the browser or stored in this repository.

Matching is case-insensitive substring matching. A rule can match inside a longer word, so results can include false positives. The application handler does not write submitted text to an application content table; avoid entering passwords or other sensitive personal information.

## Supported reference lists

- United States (`US`)
- Brazil (`BR`)
- Romania (`RO`)
- Philippines (`PH`)

## Local development

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Production build

```bash
npm run build
npm run start
```

## Supabase

The database table is `public.ban_words`. Row-level security is enabled, and public `SELECT` access is revoked. The `analyze-content` Edge Function uses the server-side service role to read the table.

The Edge Function also uses database RPCs for request-rate checks and concurrent-request slots. Apply the SQL migrations in `supabase/migrations/` before deploying the function. Never put the private word data in `data/`, `public/`, a client component, or a `NEXT_PUBLIC_` environment variable.

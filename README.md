# Brainly Ban Checker

A Next.js app for checking Brainly content against country-specific moderation lists.

## Architecture

The browser sends the text and selected country to a Supabase Edge Function. The Edge Function reads the private `ban_words` table, runs the existing checker algorithm, and returns the result. The ban-word list is not included in the browser bundle or this GitHub repository.

The result intentionally displays match numbers instead of the private matched words. Highlighted locations are still shown so the checker remains useful without exposing the list.

## Countries

- Brainly Philippines (`PH`)
- Brainly United States (`US`)
- Brainly Brazil (`BR`)
- Brainly Romania (`RO`)

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production build

```bash
npm run build
npm run start
```

## Supabase

The database table is `public.ban_words`. Row-level security is enabled, and public `SELECT` access is revoked. The `analyze-content` Edge Function uses Supabase's server-side service role to read the table.

The private word data must never be put back into `data/`, `public/`, a client component, or a `NEXT_PUBLIC_` environment variable.

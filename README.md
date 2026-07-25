# Secure Your Access (Demo)

Authorized cybersecurity awareness demo website with:

- Step 1: name + email
- Step 2: phone number
- Thank-you screen
- Password-protected admin dashboard
- Cloud database storage (Supabase/Postgres via REST)
- Live admin refresh using polling

## 1) Install

```bash
npm install
```

## 2) Configure

Copy `.env.example` to `.env` and set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` for server-side writes, or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` if you have Supabase policies in place
- `ADMIN_PASSWORD`

Use `SUPABASE_SERVICE_ROLE_KEY` on Vercel so submissions write online directly to Supabase without exposing the key in the browser.

## 3) Create table in Supabase

Run the SQL in [`supabase-schema.sql`](/Users/test/Desktop/redirected/supabase-schema.sql) in the Supabase SQL editor:

The table stores:

- `name`
- `email`
- `phone`
- `source_url`
- `created_at`

The app writes online through Vercel API routes. With a service-role key, Supabase accepts the inserts and reads server-side and nothing is stored locally.

## 4) Run

```bash
npm run dev
```

Open:

- User flow: `http://localhost:3000`
- Admin: `http://localhost:3000/admin`

The admin table automatically shows the source URL, so you can see the page the user arrived from before completing the flow.

## Source tracking with a Chrome extension

Browser referrer data is often removed during extension-driven redirects, so pass the original tab URL explicitly. Configure the extension to open the feedback site in this format:

```text
https://your-feedback-domain.example/?source_url=<URL-encoded original tab URL>
```

For example, an extension redirecting from `https://site.example/campaign` should open:

```text
https://your-feedback-domain.example/?source_url=https%3A%2F%2Fsite.example%2Fcampaign
```

The app stores this value temporarily in the browser only until the form is submitted, then sends it as `source_url` to Supabase. It also accepts `sourceUrl` and `source` while you update existing extension links. A normal link still uses the browser referrer as a fallback.

`source_url` identifies the originating website/page; it does not reliably identify a visitor's country. If you need country reporting, collect it separately with clear user notice and an appropriate consent/privacy policy.

## Deploying to Vercel

This app is designed to deploy with the static front end plus Vercel API routes.

- Keep `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Vercel environment variables
- Set `ADMIN_PASSWORD` in Vercel environment variables
- Keep the Supabase table created with [`supabase-schema.sql`](/Users/test/Desktop/redirected/supabase-schema.sql)
- The browser form posts to `/api/submissions`
- The admin page reads from `/api/submissions-list`

The admin page is still protected by password, but it now lives online with the deployment instead of depending on a local Express server.

## HTTPS

Use HTTPS in production via your hosting provider. You can set `FORCE_HTTPS=true` when running behind a reverse proxy that sets `x-forwarded-proto`.

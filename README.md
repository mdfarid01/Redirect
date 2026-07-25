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
